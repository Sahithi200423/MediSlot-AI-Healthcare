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
  const artifactDir = 'C:\\Users\\MI\\.gemini\\antigravity-ide\\brain\\20e5634f-969f-42b3-bc66-857131ae9c06';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(artifactDir, 'scratch', 'chrome-profile-hp-' + Date.now());
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let versionInfo;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) {
        versionInfo = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }

  const targetsRes = await fetch('http://127.0.0.1:9223/json/list');
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
  await new Promise(r => setTimeout(r, 3500));

  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const imgPath = path.join(artifactDir, 'current_homepage_sculpture.png');
  fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
  console.log('Homepage saved to:', imgPath);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
