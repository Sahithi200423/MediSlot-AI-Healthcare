/**
 * MediSlot PR #3.1 — Security Hardening Automated Verification Test
 * 
 * Tests:
 * 1. Request Correlation ID generation (UUID v4 when absent)
 * 2. Request Correlation ID preservation (when valid X-Request-Id provided)
 * 3. Request Correlation ID sanitization (rejects malformed/injection headers, generates UUID)
 * 4. Health endpoints exemption (/api/health, /health, / remain 100% accessible under repeated requests)
 * 5. Login rate limiting: 5 failed attempts allowed, 6th attempt returns HTTP 429
 * 6. Structured JSON 429 response schema: { success: false, error: { message, statusCode: 429 } }
 * 7. Standard RateLimit-* response headers
 * 8. Registration rate limiting: 3 attempts allowed, 4th attempt returns HTTP 429
 * 9. Trusted proxy evaluation (distinct X-Forwarded-For IPs have isolated rate limit buckets)
 */

const { spawn } = require("child_process")
const http = require("http")
const path = require("path")

const TEST_PORT = 5093
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let rawData = ""
      res.on("data", (chunk) => (rawData += chunk))
      res.on("end", () => {
        let parsed = null
        try {
          parsed = JSON.parse(rawData)
        } catch (e) {
          parsed = null
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: rawData,
        })
      })
    })

    req.on("error", reject)
    req.setTimeout(8000, () => {
      req.destroy()
      reject(new Error("Request timed out"))
    })

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData))
    }
    req.end()
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  console.log("==================================================")
  console.log("🔒 MediSlot PR #3.1 Security Hardening Verification")
  console.log("==================================================")

  const serverDir = path.resolve(__dirname, "..")
  const entryPoint = path.join(serverDir, "dist", "index.js")

  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(TEST_PORT),
    AI_SERVICE_SECRET: "mock-ai-service-secret-production-test",
    JWT_SECRET: "mock-jwt-secret-min-32-chars-long-production-test",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medislot",
    DIRECT_URL: process.env.DIRECT_URL || "postgresql://postgres:postgres@localhost:5432/medislot",
  }

  console.log(`Starting compiled server: ${entryPoint} on port ${TEST_PORT}...`)
  const child = spawn(process.execPath, [entryPoint], {
    cwd: serverDir,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  })

  let serverStarted = false
  let serverLogs = ""

  child.stdout.on("data", (data) => {
    const text = data.toString()
    serverLogs += text
    if (text.includes("MediSlot Core Backend API running successfully")) {
      serverStarted = true
    }
  })

  child.stderr.on("data", (data) => {
    serverLogs += data.toString()
  })

  // Wait for server to boot
  let attempts = 0
  while (!serverStarted && attempts < 30) {
    await sleep(200)
    attempts++
  }

  if (!serverStarted) {
    console.error("❌ Failed to start server in time. Logs:")
    console.error(serverLogs)
    child.kill()
    process.exit(1)
  }

  console.log("✅ Server booted successfully on port " + TEST_PORT + "\n")

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: Request Correlation ID Generation
    // -----------------------------------------------------------------
    console.log("Test 1: Request Correlation ID Generation (UUID v4)")
    const res1 = await request({
      hostname: "127.0.0.1",
      port: TEST_PORT,
      path: "/api/health",
      method: "GET",
    })
    assert(res1.statusCode === 200, "Health check responded with 200")
    const reqId1 = res1.headers["x-request-id"]
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    assert(Boolean(reqId1 && uuidRegex.test(reqId1)), `Generated X-Request-Id header (${reqId1}) is valid UUID v4`)

    // -----------------------------------------------------------------
    // TEST 2: Request Correlation ID Preservation
    // -----------------------------------------------------------------
    console.log("\nTest 2: Request Correlation ID Preservation")
    const customReqId = "client-trace-id-12345"
    const res2 = await request({
      hostname: "127.0.0.1",
      port: TEST_PORT,
      path: "/api/health",
      method: "GET",
      headers: {
        "X-Request-Id": customReqId,
      },
    })
    assert(res2.statusCode === 200, "Health check responded with 200")
    assert(res2.headers["x-request-id"] === customReqId, `Incoming valid X-Request-Id (${customReqId}) was preserved`)

    // -----------------------------------------------------------------
    // TEST 3: Request Correlation ID Sanitization (Header Injection Prevention)
    // -----------------------------------------------------------------
    console.log("\nTest 3: Request Correlation ID Sanitization")
    const malformedId = "<script>alert('xss')</script>"
    const res3 = await request({
      hostname: "127.0.0.1",
      port: TEST_PORT,
      path: "/api/health",
      method: "GET",
      headers: {
        "X-Request-Id": malformedId,
      },
    })
    const reqId3 = res3.headers["x-request-id"]
    assert(reqId3 !== malformedId, "Malformed X-Request-Id was rejected")
    assert(uuidRegex.test(reqId3), `Clean UUID v4 was generated instead (${reqId3})`)

    // -----------------------------------------------------------------
    // TEST 4: Health Endpoints Exemption
    // -----------------------------------------------------------------
    console.log("\nTest 4: Health Endpoints Exemption Under High Frequency")
    let healthPass = true
    for (let i = 0; i < 15; i++) {
      const hRes = await request({
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: i % 2 === 0 ? "/api/health" : "/health",
        method: "GET",
      })
      if (hRes.statusCode !== 200) {
        healthPass = false
        break
      }
    }
    assert(healthPass, "15 consecutive requests to health endpoints returned HTTP 200 with zero rate limiting")

    // -----------------------------------------------------------------
    // TEST 5 & 6 & 7: Login Rate Limiting (5 failed allowed, 6th returns 429)
    // -----------------------------------------------------------------
    console.log("\nTest 5: Login Rate Limiting (5 Failed Attempts per IP -> HTTP 429)")
    const testLoginIp = "203.0.113.42"
    let loginResponses = []

    for (let i = 1; i <= 6; i++) {
      const loginRes = await request(
        {
          hostname: "127.0.0.1",
          port: TEST_PORT,
          path: "/api/auth/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": testLoginIp,
          },
        },
        JSON.stringify({
          email: "nonexistent.attacker@example.com",
          password: "wrongpassword123",
        })
      )
      loginResponses.push(loginRes)
    }

    const first5Statuses = loginResponses.slice(0, 5).map((r) => r.statusCode)
    const allFirst5FailedNormally = first5Statuses.every((s) => s === 400 || s === 401)
    assert(allFirst5FailedNormally, `First 5 failed login attempts returned 400/401 (got: ${first5Statuses.join(", ")})`)

    const sixthRes = loginResponses[5]
    assert(sixthRes.statusCode === 429, `6th failed login attempt returned HTTP 429 Too Many Requests (got: ${sixthRes.statusCode})`)

    // Check structured JSON response
    console.log("\nTest 6: Structured 429 Response Format")
    assert(sixthRes.data && sixthRes.data.success === false, "429 response has success: false")
    assert(
      sixthRes.data && sixthRes.data.error && sixthRes.data.error.statusCode === 429,
      "429 response has error.statusCode: 429"
    )
    assert(
      sixthRes.data && sixthRes.data.error && typeof sixthRes.data.error.message === "string",
      `429 response has descriptive error message: "${sixthRes.data?.error?.message}"`
    )

    // Check standard rate-limit headers
    console.log("\nTest 7: Standard RateLimit Headers")
    const hasRateLimitHeader = Boolean(
      sixthRes.headers["ratelimit-limit"] ||
      sixthRes.headers["ratelimit-remaining"] !== undefined ||
      sixthRes.headers["retry-after"]
    )
    assert(hasRateLimitHeader, "RateLimit-* / Retry-After standard response headers are present")
    assert(!sixthRes.headers["x-ratelimit-limit"], "Legacy X-RateLimit headers are disabled (legacyHeaders: false)")

    // -----------------------------------------------------------------
    // TEST 8: Registration Rate Limiting (3 attempts allowed, 4th -> 429)
    // -----------------------------------------------------------------
    console.log("\nTest 8: Registration Rate Limiting (3 Attempts per IP -> HTTP 429)")
    const testRegisterIp = "203.0.113.88"
    let registerResponses = []

    for (let i = 1; i <= 4; i++) {
      const regRes = await request(
        {
          hostname: "127.0.0.1",
          port: TEST_PORT,
          path: "/api/auth/register",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": testRegisterIp,
          },
        },
        JSON.stringify({
          name: `Test User ${i}`,
          email: `testuser${i}_${Date.now()}@example.com`,
          password: "Password123!",
          role: "patient",
        })
      )
      registerResponses.push(regRes)
    }

    const regFirst3 = registerResponses.slice(0, 3).map((r) => r.statusCode)
    assert(regFirst3.every((s) => s !== 429), `First 3 registration attempts were evaluated (got: ${regFirst3.join(", ")})`)
    const fourthRegRes = registerResponses[3]
    assert(fourthRegRes.statusCode === 429, `4th registration attempt returned HTTP 429 (got: ${fourthRegRes.statusCode})`)
    assert(
      fourthRegRes.data?.error?.statusCode === 429 && fourthRegRes.data?.success === false,
      "Registration 429 adheres to structured { success: false, error: { message, statusCode: 429 } }"
    )

    // -----------------------------------------------------------------
    // TEST 9: Trusted Proxy Isolation
    // -----------------------------------------------------------------
    console.log("\nTest 9: Trusted Proxy Client IP Isolation")
    const freshIp = "203.0.113.99"
    const freshLoginRes = await request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": freshIp,
        },
      },
      JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      })
    )
    assert(
      freshLoginRes.statusCode !== 429,
      `Fresh IP (${freshIp}) is NOT rate-limited (got ${freshLoginRes.statusCode}), proving IP tracking uses X-Forwarded-For`
    )

    // -----------------------------------------------------------------
    // TEST 10: Morgan Log Format Inspection
    // -----------------------------------------------------------------
    console.log("\nTest 10: Morgan Request Correlation ID Logging")
    const hasLoggedReqId = serverLogs.includes(customReqId) || serverLogs.includes(reqId1)
    assert(hasLoggedReqId, "Morgan log outputs include the correlation ID [:req-id]")

  } catch (err) {
    console.error("Test execution error:", err)
    failed++
  } finally {
    console.log("\nShutting down test server...")
    child.kill()
  }

  console.log("\n==================================================")
  console.log(`Verification Summary: ${passed} PASSED, ${failed} FAILED`)
  console.log("==================================================")

  if (failed > 0) {
    process.exit(1)
  }
}

run()

