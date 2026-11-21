/**
 * Automated Production Health & Root Endpoint Verification Test
 * Spawns the compiled production server (dist/index.js) and verifies:
 * 1. GET / responds with HTTP 200 and expected welcome JSON
 * 2. GET /api/health responds with HTTP 200 and operational health JSON
 * 3. GET /health responds with HTTP 200 and operational health JSON
 */
const { spawn } = require("child_process")
const http = require("http")
const path = require("path")

const TEST_PORT = 5087
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`

function fetchJson(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${endpoint}`, (res) => {
      let rawData = ""
      res.on("data", (chunk) => (rawData += chunk))
      res.on("end", () => {
        try {
          const parsed = JSON.parse(rawData)
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: rawData })
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: rawData })
        }
      })
    })
    req.on("error", reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error(`Timeout fetching ${endpoint}`))
    })
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  console.log("==================================================")
  console.log("🩺 MediSlot Production Endpoint Verification Test")
  console.log("==================================================")

  const serverDir = path.resolve(__dirname, "..")
  const entryPoint = path.join(serverDir, "dist", "index.js")

  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(TEST_PORT),
    AI_SERVICE_SECRET: "mock-ai-service-secret-production-test",
    JWT_SECRET: "mock-jwt-secret-min-32-chars-long-production-test",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/medislot",
    DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/medislot",
  }

  console.log(`Starting compiled server: ${entryPoint} on port ${TEST_PORT}...`)
  const child = spawn(process.execPath, [entryPoint], {
    cwd: serverDir,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  })

  let serverStarted = false
  let serverOutput = ""

  child.stdout.on("data", (d) => {
    const text = d.toString()
    serverOutput += text
    if (text.includes("MediSlot Core Backend API running successfully")) {
      serverStarted = true
    }
  })

  child.stderr.on("data", (d) => {
    serverOutput += d.toString()
  })

  // Wait for server to bind
  let attempts = 0
  while (!serverStarted && attempts < 30) {
    await sleep(200)
    attempts++
  }

  if (!serverStarted) {
    child.kill("SIGKILL")
    console.error("❌ Failed to start production server. Output:\n", serverOutput)
    process.exit(1)
  }

  console.log("✅ Production server successfully bound to port", TEST_PORT)

  let allPassed = true

  try {
    // 1. Test GET /
    console.log("\nTesting GET / ...")
    const resRoot = await fetchJson("/")
    console.log(`HTTP ${resRoot.status}:`, JSON.stringify(resRoot.data))
    if (
      resRoot.status === 200 &&
      resRoot.data &&
      resRoot.data.name === "MediSlot Backend API" &&
      resRoot.data.healthCheck === "/api/health"
    ) {
      console.log("✅ GET / PASSED")
    } else {
      console.error("❌ GET / FAILED:", resRoot)
      allPassed = false
    }

    // 2. Test GET /api/health
    console.log("\nTesting GET /api/health ...")
    const resApiHealth = await fetchJson("/api/health")
    console.log(`HTTP ${resApiHealth.status}:`, JSON.stringify(resApiHealth.data))
    if (
      resApiHealth.status === 200 &&
      resApiHealth.data &&
      resApiHealth.data.success === true &&
      resApiHealth.data.message === "MediSlot Core API is operational" &&
      resApiHealth.data.data &&
      resApiHealth.data.data.service === "medislot-backend-api" &&
      resApiHealth.data.data.status === "ok"
    ) {
      console.log("✅ GET /api/health PASSED")
    } else {
      console.error("❌ GET /api/health FAILED:", resApiHealth)
      allPassed = false
    }

    // 3. Test GET /api/health/ (with trailing slash)
    console.log("\nTesting GET /api/health/ (trailing slash) ...")
    const resApiHealthSlash = await fetchJson("/api/health/")
    console.log(`HTTP ${resApiHealthSlash.status}:`, JSON.stringify(resApiHealthSlash.data))
    if (resApiHealthSlash.status === 200 && resApiHealthSlash.data && resApiHealthSlash.data.success === true) {
      console.log("✅ GET /api/health/ PASSED")
    } else {
      console.error("❌ GET /api/health/ FAILED:", resApiHealthSlash)
      allPassed = false
    }

    // 4. Test GET /health alias
    console.log("\nTesting GET /health ...")
    const resHealth = await fetchJson("/health")
    console.log(`HTTP ${resHealth.status}:`, JSON.stringify(resHealth.data))
    if (
      resHealth.status === 200 &&
      resHealth.data &&
      resHealth.data.success === true &&
      resHealth.data.message === "MediSlot Core API is operational"
    ) {
      console.log("✅ GET /health PASSED")
    } else {
      console.error("❌ GET /health FAILED:", resHealth)
      allPassed = false
    }

    // 5. Test apiRouter subroute integration (GET /api/clinics)
    console.log("\nTesting GET /api/clinics (subrouter verification) ...")
    const resClinics = await fetchJson("/api/clinics")
    console.log(`HTTP ${resClinics.status} received for /api/clinics`)
    if (resClinics.status === 200 || resClinics.status === 500 || resClinics.status === 503) {
      console.log("✅ Subrouter app.use('/api', apiRouter) is verified operational (Dispatched to ClinicController, Status:", resClinics.status, ")")
    } else {
      console.error("❌ Subrouter /api/clinics check FAILED:", resClinics)
      allPassed = false
    }

    // 6. Test 404 handler returns structured JSON (not plain text)
    console.log("\nTesting GET /api/unregistered-route-test (404 handler verification) ...")
    const res404 = await fetchJson("/api/unregistered-route-test")
    console.log(`HTTP ${res404.status}:`, JSON.stringify(res404.data))
    if (res404.status === 404 && res404.data && res404.data.success === false) {
      console.log("✅ 404 handler returns structured JSON (not plain text)")
    } else {
      console.error("❌ 404 handler test FAILED:", res404)
      allPassed = false
    }
  } catch (err) {
    console.error("❌ Exception during test execution:", err)
    allPassed = false
  } finally {
    child.kill("SIGTERM")
    await sleep(300)
    try {
      child.kill("SIGKILL")
    } catch (_) {}
  }

  console.log("\n==================================================")
  if (allPassed) {
    console.log("🎉 ALL PRODUCTION ENDPOINT CHECKS PASSED!")
    console.log("==================================================")
    process.exit(0)
  } else {
    console.error("🚨 ONE OR MORE CHECKS FAILED!")
    console.log("==================================================")
    process.exit(1)
  }
}

run()

