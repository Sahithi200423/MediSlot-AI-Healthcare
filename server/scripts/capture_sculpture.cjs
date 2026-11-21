const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const artifactDir = 'C:\\Users\\MI\\.gemini\\antigravity-ide\\brain\\f3597ef0-5909-4c4f-a78d-babd1433936f';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(artifactDir, 'scratch', 'chrome-profile-sculp-' + Date.now());
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9225;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=1440,900'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let versionInfo;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        versionInfo = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }

  const targetsRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await targetsRes.json();
  const target = targets.find(t => t.type === 'page') || targets[0];
  const wsUrl = target.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:5173/' });
  // Wait for React and Three.js scene to render frames
  await new Promise(r => setTimeout(r, 4000));

  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const imgPath = path.join(artifactDir, 'current_homepage_sculpture.png');
  fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
  console.log('Homepage saved to:', imgPath);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
