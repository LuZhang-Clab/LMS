# Lumos Creative 网站重构总结

> 重构时间：2026 年 4 月  
> 原项目目录：`lumos-creative/`  
> 新项目目录：`lumos-creative/next-app/`

---

## 一、整体架构对比

| 维度 | 原网站 | next-app |
|------|--------|----------|
| **框架** | 纯原生 HTML/CSS/JS + Express 后端 | Next.js 14 (App Router) |
| **数据存储** | `data.json` 文件 + SSE 推送 | Prisma ORM + PostgreSQL (Neon) |
| **图片存储** | 本地 `public/images/` | Vercel Blob |
| **SSR/SEO** | 无，纯客户端渲染 | 服务端渲染 + 路由缓存控制 |
| **部署** | Express 手动部署 | Vercel 自动部署 |

---

## 二、视觉与交互

| 维度 | 原网站 | next-app |
|------|--------|----------|
| **Splash 开场** | Canvas 粒子星空动画 | 纯 CSS 逐字弹出文字动画 |
| **Cursor 效果** | Canvas 全局鼠标轨迹 | `CursorProvider` React 组件 |
| **页面导航** | 单页 JS 切换 `display:none/block` | Next.js 路由 `/` `/about` `/projects/[id]` |
| **多语言** | JS 动态替换 DOM + URL 参数 `/en/zh` | Cookie + `LocaleProvider` 服务端/客户端双支持 |
| **富文本编辑** | 无（纯 textarea） | Tiptap 可视化编辑器，所见即所得 |
| **图片灯箱** | 基础 `lightbox` div | 保留并增强 |
| **数据推送** | SSE 实时推送 | 页面路由切换即刷新，无需推送 |

---

## 三、后台管理（Admin）

### 3.1 技术架构

| 维度 | 原网站 | next-app |
|------|--------|----------|
| **页面** | 独立 HTML，~700 行原生 JS | Next.js React 组件，`AdminDashboard.tsx` ~1800 行 |
| **编辑器** | textarea + 自定义语法 `##` / `[img:]` / `[link:]` | **Tiptap 富文本编辑器**，所见即所得 |
| **路由守卫** | 前端 JS `checkAuth()` 拦截请求 | Next.js `middleware.ts` 服务端拦截 |
| **登录页** | `loginOverlay` DOM 蒙层 | 独立 `/login` 路由页面 |

### 3.2 编辑体验

**原网站**：项目详情用 textarea + 手写格式标记

```
## 标题
正文段落
[img: 1.jpg, 2.jpg]
[link: 链接文字 | https://...]
```

**next-app**：Tiptap 可视化编辑器，功能完整：

- 工具栏：加粗 / 斜体 / 下划线 / H2 / H3 / 对齐 / 链接 / 列表
- 图片上传：点击上传、拖拽上传、粘贴截图（clipboard 拦截）均可
- 图片点击选中后可替换
- 所见即所得

### 3.3 项目数据保存粒度

| 维度 | 原网站 | next-app |
|------|--------|----------|
| **保存方式** | 全量 `POST /api/data` 提交整个 `data.json` | **逐项 `PUT /api/admin/update`** 单项目/单分类独立保存 |
| **保存时机** | 点击「保存并发布」全量保存 | 项目内展开后单独保存，可单独持久化 |
| **图片提取** | 手动填入 `images[]` 数组 | 自动从 Tiptap 富文本 HTML 中正则提取 |
| **封面逻辑** | 手动选择封面 | **第一张图自动升为封面**，也可手动切换 |

### 3.4 项目管理交互增强

- **拖拽排序**：分类和项目都支持拖拽排序（HTML5 DnD API），原网站无此功能
- **折叠展开**：项目卡片默认折叠，点击才展开编辑，减少视觉噪音
- **新增/删除**：分类/项目添加后直接调用 API 持久化，不用等「保存」按钮
- **自动封面**：上传第一张图自动升封面，删除封面图时自动补位

### 3.5 认证与安全

| 维度 | 原网站 | next-app |
|------|--------|----------|
| **登录页** | 独立 `loginOverlay` DOM 蒙层 | 独立 `/login` 路由，URL 可直接访问 |
| **守卫方式** | 前端 `checkAuth()` + 每个 API 判断 | `middleware.ts` 对 `/admin/**` 服务端拦截 |
| **Token 存储** | `sessionStorage` | Cookie（配合 `auth.ts` 模块） |

### 3.6 About / 工作经历编辑

同样升级为 Tiptap 富文本，支持图文混排，不再是纯 textarea。内容存储从结构化 blocks 对象（`{type, text, files}`）改为直接存 **HTML 字符串**，渲染更灵活。

---

## 四、核心重构亮点

1. **全栈 Next.js 化** — 前端后端一体，路由即 API，无需独立 Express 服务
2. **数据层升级** — 从手动 JSON 文件到 Prisma + PostgreSQL，类型安全，迁移可控
3. **SSR + 缓存控制** — 首页/About 加 `force-dynamic` + Edge Cache 禁用，保证内容实时
4. **安全加固** — 所有 API 有输入校验，字段名统一 camelCase/snakeCase 规范，Blob URL 处理兼容
5. **国际化重构** — 放弃 `/en/zh` URL 路由，改为 Cookie 方案，体验更自然

---

## 五、文件结构

### 原网站

```
lumos-creative/
├── public/
│   ├── index.html          # 前台单页 HTML
│   ├── admin/index.html    # 后台管理 HTML
│   ├── css/style.css       # 全站样式
│   └── js/app.js           # 前台交互逻辑
├── server/
│   └── index.js            # Express 后端服务
├── api/
│   ├── data.js             # 数据读写 API（Vercel Blob）
│   ├── upload.js            # 图片上传 API
│   ├── login.js            # 登录 API
│   ├── verify.js           # Token 验证
│   └── delete-image.js     # 图片删除
└── data.json               # 数据文件
```

### next-app

```
lumos-creative/next-app/
├── src/
│   ├── app/
│   │   ├── page.tsx             # 首页
│   │   ├── about/page.tsx       # 关于页
│   │   ├── projects/[id]/page.tsx  # 项目详情页
│   │   ├── admin/
│   │   │   ├── page.tsx         # 管理后台
│   │   │   ├── layout.tsx       # Admin 布局
│   │   │   └── login/page.tsx   # 登录页
│   │   └── api/
│   │       ├── data/route.ts          # 公开数据 API
│   │       ├── upload/route.ts        # 图片上传 API
│   │       └── admin/
│   │           ├── route.ts           # 管理员认证
│   │           └── update/route.ts    # 细粒度更新 API
│   ├── components/
│   │   ├── HomeClient.tsx           # 首页客户端组件
│   │   ├── AboutClient.tsx          # 关于页客户端组件
│   │   ├── ProjectDetailClient.tsx  # 项目详情组件
│   │   ├── Nav.tsx                 # 导航组件
│   │   ├── CursorProvider.tsx      # 自定义鼠标光效
│   │   ├── SplashProvider.tsx      # 开场动画
│   │   └── admin/
│   │       ├── AdminDashboard.tsx  # 后台主面板
│   │       └── TiptapEditor.tsx    # 富文本编辑器
│   ├── context/
│   │   ├── LocaleProvider.tsx      # 多语言 Provider
│   │   └── LocaleContext.tsx       # 多语言上下文
│   ├── lib/
│   │   ├── db.ts             # Prisma 数据库客户端
│   │   ├── auth.ts           # 认证逻辑
│   │   ├── cursor.ts         # Cursor 效果逻辑
│   │   └── cache.ts         # 缓存工具
│   ├── i18n/request.ts       # i18n 配置
│   └── middleware.ts         # 路由中间件（认证守卫）
├── prisma/
│   └── schema.prisma         # 数据库 schema
└── public/                   # 静态资源
```

---

## 六、Git 提交记录

重构过程中主要提交（按时间倒序）：

| 提交 | 说明 |
|------|------|
| `82c97e8` | refactor: rewrite SplashProvider with pure CSS letter-in animation |
| `7f3e75a` | fix: add middleware to disable Vercel Edge Cache on homepage |
| `8e4638e` | fix: add force-dynamic to prevent stale static cache on homepage and about page |
| `b81fe27` | feat: support listing all projects in debug-project API |
| `bff360c` | chore: increase page container max-width from 1400px to 1920px |
| `24570c6` | chore: add project images, remove stale test images |
| `893bada` | fix: skip splash animation on /admin, resolve modal image paths |
| `c35c36f` | refactor: migrate editor to Tiptap, store content as HTML strings |
| `29a3c88` | feat: add global cursor canvas on all pages |
| `3cb47fb` | fix: multiple UI improvements — logo locale switch, about path, lightbox, footer, splash, upload bugs |
| `c9ba08e` | feat: rebuild admin dashboard with React components |
| `a54de5d` | fix: middleware auth guard + CDN fonts |
| `9eb5dac` | refactor: split /admin into login page + server-side auth guard |
| `52d9f0f` | fix: secure all API endpoints, add input validation |
| `00bf15f` | fix: switch from SQLite to PostgreSQL (Neon) |
| `052fd37` | feat: add Next.js admin & API with Prisma, security fixes |
