// patch-app-asar.cjs: 对 WeFlow 产物（win-unpacked）的 app.asar 打 keyProvider 补丁
// 用法: node patch-app-asar.cjs <resources 目录>
// 效果: app.asar 解包为 app/ 目录（asar 改名 .bak），main.js 的 keyProviderService
//       spawn 支持 .cjs 脚本 provider（ELECTRON_RUN_AS_NODE 降级 node 模式）
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resourcesDir = process.argv[2];
if (!resourcesDir || !fs.existsSync(path.join(resourcesDir, 'app.asar'))) {
  console.error('用法: node patch-app-asar.cjs <含 app.asar 的 resources 目录>');
  process.exit(2);
}
const appDir = path.join(resourcesDir, 'app');
const asarPath = path.join(resourcesDir, 'app.asar');
const asarBak = asarPath + '.bak';

if (fs.existsSync(appDir)) {
  console.log('app 目录已存在，跳过解包');
} else {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  console.log('extracting app.asar ...');
  execSync(`${npx} --yes @electron/asar extract "${asarPath}" "${appDir}"`, { stdio: 'inherit' });
  fs.renameSync(asarPath, asarBak);
  console.log('asar renamed to app.asar.bak');
}

const mainJs = path.join(appDir, 'dist-electron', 'main.js');
let src = fs.readFileSync(mainJs, 'utf8');
const orig = '(0,a.spawn)(r,[],{stdio:[`pipe`,`pipe`,`pipe`],windowsHide:!0})';
const fixed = "(0,a.spawn)(/\\.cjs$/i.test(r)?process.execPath:r,/\\.cjs$/i.test(r)?[r]:[],{stdio:[`pipe`,`pipe`,`pipe`],windowsHide:!0,...(/\\.cjs$/i.test(r)?{env:{...process.env,ELECTRON_RUN_AS_NODE:`1`}}:{})})";
if (src.includes(fixed)) {
  console.log('main.js already patched');
} else if (src.includes(orig)) {
  src = src.split(orig).join(fixed);
  fs.writeFileSync(mainJs, src);
  console.log('main.js PATCHED (keyProvider .cjs + ELECTRON_RUN_AS_NODE)');
} else {
  console.error('ORIG spawn pattern NOT FOUND — 产物代码可能已变化，需人工检查');
  process.exit(1);
}
console.log('DONE:', resourcesDir);
