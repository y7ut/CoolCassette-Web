# CoolCassette Web UI

基于 Vite + React + TypeScript + Tailwind CSS 的 CoolCassette 音乐库浏览器。

## 功能

- 专辑列表浏览，支持按专辑名/艺术家/创建时间/修改时间排序
- 无限滚动分页，带索引一致性控制（409 Conflict 自动恢复）
- 专辑详情页：
  - `built` 状态 — 实时磁带动画（Canvas 卷轴动画复刻 demo.html）
  - `preview_ready` 状态 — 静态预览图
  - `not_built` 状态 — 占位 + 生成预览按钮
- 播放列表：点击播放/暂停，磁带动画与播放状态绑定
- 从详情页返回列表页时自动恢复滚动位置

## 启动

### 1. 启动后端服务

```bash
cd /path/to/CoolCassette
./coolcassette server \
  --music-dir ~/Music \
  --wampy-dir /Volumes/WALKMAN/wampy \
  --listen 127.0.0.1:7350
```

### 2. 启动前端开发服务器

```bash
cd web
npm run dev
```

前端默认运行在 http://localhost:5173/，API 请求通过 Vite proxy 转发到 `127.0.0.1:7350`。

### 3. 构建生产版本

```bash
cd web
npm run build
```

构建输出在 `web/dist/` 目录。

## 技术栈

- Vite 6
- React 19 + TypeScript
- Tailwind CSS 4
- React Router v7
- TanStack Query v5（无限滚动 + 缓存）
- Zustand（播放器状态）

## 接口代理

`vite.config.ts` 中已配置代理：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:7350',
      changeOrigin: true,
    },
  },
}
```

如需修改后端地址，请编辑 `web/vite.config.ts`。
