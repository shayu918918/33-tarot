# 33的占卜室 · GitHub 上传与图片排查

这份压缩包就是可直接发布的网页：22张牌、解语、33原色封面、新牌背和切牌／翻牌音效都已包含。无需安装程序或运行打包命令。

**先记住：解压后，上传 `index.html` 所在这一层的全部内容，并保留整个 `assets` 文件夹。**

## 1. 解压，确认上传哪一层

右键 `33塔罗牌_GitHub上传版.zip` →“全部解压”。打开解压目录，直到你能同时看到 `index.html` 和 `assets`。

正确的仓库目录应当是下面这样：

```text
仓库首页
├── index.html                 网页入口，必须在这一层
├── style.css                  网页样式
├── app.js                     抽牌与翻牌
├── audio.js                   音效
├── cards-data.js              22张牌的解语和图片路径
├── favicon.svg                小图标
├── .nojekyll                  静态网页标记，保留即可
├── README.md                  本教程
├── check-images.html          图片检查页
└── assets                     整个文件夹一起上传
    ├── cards                  22张完整牌面
    ├── thumbs                 22张牌面缩略图
    ├── hero                   3个尺寸的33原色封面
    └── card-back-v3.svg        牌背花纹
```

错误例子：`仓库 → 33塔罗牌_GitHub上传版 → index.html`。这会把首页多放进去一层。按照本教程选择仓库根目录发布时，首页应直接出现在仓库首页。

也不要把 ZIP 文件本身当作网页上传；发布前要先解压。可以先双击本地 `index.html`，确认网页能打开。

## 2. 新建仓库，上传全部文件

1. 登录 GitHub，点击右上角 **＋ → New repository**。
2. 仓库名可填 `sansan-tarot`。已有专门存放这个网页的仓库，可以直接使用。
3. 使用免费账户按本教程发布时，选择 **Public**。新建时打开 **Add README**，再点 **Create repository**。普通 GitHub Pages 网页对互联网公开，请按公开展示网页来使用。[GitHub Pages 说明](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
4. 在仓库的 **Code** 首页点 **Add file → Upload files**。
5. 在电脑上打开解压后的目录，选中这一层的**所有文件和 `assets` 文件夹**，一起拖进上传区域。不要把最外层“33塔罗牌_GitHub上传版”文件夹整层拖进去。
6. 等待上传列表完成。检查列表里能看到 `assets/cards/00-fool.webp` 这样的完整路径，不能只剩 `00-fool.webp`。
7. 提交说明可写“上传33塔罗牌网页”。如果可以直接提交到 `main`，选择该项并提交；按钮可能显示 **Commit changes** 或 **Propose changes**。如果进入新分支／拉取请求流程，继续完成 **Create pull request → Merge pull request → Confirm merge**，确保文件最终进入 `main`。

GitHub 浏览器上传支持拖入文件夹，一次最多100个文件、单个文件最多25 MiB。本包只有57个文件，全部小于该单文件限制，可以一次上传。[GitHub 上传说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

## 3. 打开 GitHub Pages

在仓库中进入 **Settings → Pages**，按下面选择：

| 设置项 | 选择 |
| --- | --- |
| Source | Deploy from a branch |
| Branch | main |
| Folder | / (root) |

然后点 **Save**。这份包已经是成品网页，不需要另选框架，也不需要把发布目录改成 `docs` 或 `dist`。[GitHub 发布源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

进入仓库 **Actions**，查看最新的 Pages 发布任务；如果还在运行，先等它结束。成功后回到 **Settings → Pages**，点 **Visit site**。首次发布或更新可能需要几分钟，官方说明变更最长可能要10分钟才出现。[GitHub Pages 发布说明](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

网站地址通常是 `https://你的用户名.github.io/sansan-tarot/`。仓库名若不同，替换最后一段。以 Pages 页面给出的地址为准；`github.com/用户名/仓库名` 是文件管理页面。

## 4. 图片不显示，先用检查页

在网站地址后加 `check-images.html`，例如：

```text
https://你的用户名.github.io/sansan-tarot/check-images.html
```

打开后点“开始检查”。它会逐一检查49个图片资源：22张牌面、22张缩略图、3张封面、1张牌背和1个小图标。检查页不出现在主网页菜单里。

- **全部通过**：这些图片在当前地址可读取。回首页按 `Ctrl + F5` 刷新；若仍有问题，再看最新发布是否成功，以及 `cards-data.js`、`style.css`、`app.js` 是否也上传了。
- **有失败项**：点该项的“直接打开”。若看到404，通常是该文件缺失、路径写错或大小写不一致；若是连接失败，稍后重试并检查网络。回仓库找到同一路径，补传对应文件夹，再等发布完成。
- **检查页本身404**：先确认它和 `index.html` 位于仓库根目录，以及 Pages 的发布分支／目录选择正确。

本地检查通过、线上检查失败时，优先检查上传后的文件层级和最新部署状态。

## 5. 最容易造成图片不显示的情况

| 看到的现象 | 优先检查 | 怎么处理 |
| --- | --- | --- |
| 首页能开，所有图片都不见了 | `assets` 是否漏传、是否被多套一层 | 重新上传完整 `assets`，让它和 `index.html` 同一层 |
| 首页封面正常，牌组图片不见了 | `assets/thumbs`、`assets/cards` 是否齐全 | 两个文件夹都保留，不能只传牌面 |
| 牌组是空白，连牌名都没出现 | `cards-data.js`、`app.js` 是否缺失 | 补传同版本文件，等待发布后刷新 |
| 只有翻牌后的大图不见了 | `assets/cards` 对应文件是否存在 | 根据检查页列出的路径补传 |
| 牌背花纹不见了 | `assets/card-back-v3.svg`、`style.css` 是否齐全 | 保持文件位置与名称一致 |
| 本地显示正常，GitHub上部分图片404 | 文件名大小写、扩展名、文件夹名 | 精确保留小写名称，不改成 `.png` 或 `.jpg` |
| 整个网站404 | 首页层级、发布分支与目录 | `main` 根目录直接放小写 `index.html`，Pages 选 `/ (root)` |
| 上传后仍是旧页面或旧图 | 最新 Pages 任务是否完成、浏览器缓存 | 等最新发布成功，再按 `Ctrl + F5` |

GitHub 要求入口文件叫小写 `index.html`，并位于所选发布目录顶层。[GitHub 404排查说明](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)

## 6. 图片路径为什么容易出错

本包已经全部使用相对路径，适用于带仓库名的网址，无需再修改图片地址。例如网站位于 `https://你的用户名.github.io/sansan-tarot/` 时：

```text
正确：assets/hero/33-original-640.webp
实际：…github.io/sansan-tarot/assets/hero/33-original-640.webp

不要改成：/assets/hero/33-original-640.webp
它会跑到：…github.io/assets/hero/33-original-640.webp
```

开头多一个 `/`，就会跳过网址中的仓库名。也不要在网页里使用 `C:\Users\…` 或 `file:///…`，访客无法读取你电脑里的文件。[MDN 相对地址说明](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references)

网页文件名、文件夹名和扩展名都已经配好，上传时原样保留即可。WebP 是当前图片实际格式，不要仅改文件后缀。

## 7. 以后怎样更新

回到同一个仓库的 **Code 首页**，再次用 **Add file → Upload files** 上传新版文件，保持相同目录和文件名，再提交到 `main`。等待最新 Pages 发布成功后刷新网页。

最省心的做法：每次使用一整套新版网页包，按第一步的目录结构上传；尤其不要把新版脚本与旧版图片文件夹混在一起。如果图片文件名没有变化，更新后按 `Ctrl + F5` 检查。

## 这份上传包已经检查过什么

- 22张牌的图片、缩略图和解语一一对应。
- 所有图片引用的路径与文件名大小写一致。
- 首页、样式、脚本与图片都使用可在仓库子目录下工作的路径。
- ZIP 解压后首页直接在顶层，文件夹结构完整。
- 图片继续使用压缩后的 WebP／SVG；包内不含旧封面和生成源图。

这些是本地文件检查结果。实际发布后，请再打开线上图片检查页确认上传结果。

整理日期：2026年10月26日。
