# WeFlow Upstream Build（最新源码社区构建版）

> 本仓库是 [hicccc77/WeFlow](https://github.com/hicccc77/WeFlow)（上游）**main 分支最新代码**的社区构建与修复版。
> **配套稳定版仓库**：[WeFlow-Community-Build](https://github.com/HJ-Create-World/WeFlow-Community-Build)（5.0.0 基线，验证最充分，**日常使用推荐**）。

## 两个仓库怎么选

| | [WeFlow-Community-Build（稳定版）](https://github.com/HJ-Create-World/WeFlow-Community-Build) | 本仓库（最新源码版） |
|---|---|---|
| 定位 | **日常使用推荐**，验证最充分 | 上游最新源码，尝鲜 / 体验新功能 |
| 代码基线 | 5.0.0 完整分发 + Community hotfix | 上游 main 最新 + 本仓库修复（见 [patches/](patches/)） |
| 图片 | 常规格式 | **新增 WXGF 支持**（微信 4.0 新格式图片） |
| 导出 | WCDB fallback（补丁式） | WCDB fallback（**源码级移植**） |
| 上游新功能 | — | AI Agent 子系统、灵感箱、组件外置架构 |

两个版本可并存使用（共用微信数据与配置目录，互不冲突）。**不确定就选稳定版**。

## 本仓库相对上游 main 的修复

| 修复 | 说明 |
|------|------|
| 导出 fallback 源码级移植 | WeLive 导出引擎过期/崩溃/缺失时，自动切换内置 WCDB 导出引擎（识别 4 类失败原因，见 `electron/exportWorker.ts`） |
| WXGF 图片支持 | 微信 4.0 新格式图片（wxgf 容器）在 JS 兜底解密中正确识别，走 HEVC/ffmpeg 解码（`electron/services/imageDecryptService.ts`） |
| `cleanAccountDirName` 修复 | `wxid_` 前缀的完整账号 ID 不再被误剥尾部后缀——修复导出 HTML 所有消息渲染在同一侧的问题（上游 bug） |
| native 加载错误日志 | 图片解密插件加载失败时记录真实错误（此前被静默吞掉） |

全部修改见 [`patches/weflow-upstream-latest-fixes.patch`](patches/weflow-upstream-latest-fixes.patch)（225 行，可审计）。

## 使用要求（组件外置架构）

上游把解密能力全部改为**可插拔组件**，需要在配置（`%APPDATA%\WeFlow\WeFlow-config.json`，或「设置 → 数据库」界面）指定四个组件路径：

| 字段 | 指向 | 说明 |
|------|------|------|
| `wcdbLibPath` | `resources\resources\wcdb\win32\x64\wcdb_api.dll`（**需先去时间锁**，见补丁） | 数据库组件 |
| `welivePath` | `resources\resources\welive\win32\x64\welive.exe` | 导出引擎（**自带过期锁，导出时会自动 fallback 到内置引擎**，无需处理） |
| `imageNativeAddonPath` | `resources\resources\wedecrypt\win32\x64\weflow-image-native-win32-x64.node` | 图片解密插件 |
| `keyProviderPath` | 实现 keyProvider 协议（NDJSON）的可执行文件 | 密钥提取；仓库 `patches/` 内附桥接脚本（DPAPI 解密 + Rust CLI 双路） |

**闭源组件本体**（`resources/` 下的 wcdb/welive/wedecrypt/key 目录）由使用者自行从 5.0.0 完整分发包获取，本仓库不含（见上游 `docs/third-party-components.md` 的接口契约）。

## 自己构建

```powershell
# 依赖（peer 冲突 + 缺失 peer 需手动补装）
npm install --legacy-peer-deps
npm install @lobehub/ui antd --legacy-peer-deps

# 构建（必须带双镜像变量；构建前关闭 WeFlow；产物在 release2\win-unpacked\）
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run build

# 构建后必跑两个补丁
powershell -File .\patches\patch_wcdb.ps1 -AppDir "<本目录>\release2\win-unpacked"      # wcdb_api.dll 去时间锁
node .\patches\patch-app-asar.cjs "<本目录>\release2\win-unpacked\resources"           # app.asar keyProvider 支持
```

上游原版 README 见 [README-upstream.md](README-upstream.md)。

## 已知事项

- **视频按需下载**：微信 4.0 只在本地保存已播放过的视频（未播放的仅有封面），WeFlow 无法查看磁盘上不存在的视频本体
- 上游版本号未变（5.0.0），实际代码以上游 main 分支为准
- `cleanAccountDirName` 修复仅对 `wxid_` 前缀豁免，其他账号目录命名格式如有问题欢迎反馈
- 上游闭源组件带遥测（`api.weflow.top`），介意可加防火墙出站拦截

## 致谢

- [hicccc77/WeFlow](https://github.com/hicccc77/WeFlow) —— 原作者
- [334456777/WeFlow](https://github.com/334456777/WeFlow) —— Rust CLI（密钥提取双路之一）
- [HJ-Create-World/WeFlow-Community-Build](https://github.com/HJ-Create-World/WeFlow-Community-Build) —— 稳定版兄弟仓库

**仅限个人学习与数据自用，请勿用于任何违法用途；组件版权归原权利方所有。**
