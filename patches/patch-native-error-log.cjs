// patch-native-error-log.cjs: nativeImageDecrypt 的 addon 加载失败记录真实错误
const fs = require('fs');
const p = __dirname + '/weflow-src-upstream/electron/services/nativeImageDecrypt.ts';
let src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const old = `    } catch {
      // try next candidate
    }`;
const neu = `    } catch (e) {
      // try next candidate（记录真实加载错误，便于定位 ABI/依赖问题）
      console.error('[nativeImageDecrypt] addon require failed:', candidate, String(e).slice(0, 300))
    }`;
if (src.includes(neu)) { console.log('already patched'); process.exit(0); }
if (!src.includes(old)) { console.log('OLD NOT FOUND'); process.exit(1); }
src = src.split(old).join(neu);
fs.writeFileSync(p, src);
console.log('NATIVE ERROR LOG ADDED');
