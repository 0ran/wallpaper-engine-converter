# Wallpaper Engine 转换器

[English](README.md) | 简体中文

这是一个本地网页工具，用来批量把图片或视频整理成 Wallpaper Engine 可导入的资源结构，并调用 Wallpaper Engine 自带的 `resourcecompiler64.exe` 生成 `.tex`。

![Wallpaper Engine 转换器预览](https://i.ibb.co/gFDf646g/Snow-Shot-2026-09-07-00-24-22.png)

> **重要提示**
>
> 转换生成的内容不会自动显示为场景图层，请在 `scene.json` 项目中手动添加对应的资源引用。

## 使用方法

1. 执行 `npm start`，或双击 `start.cmd`。
2. 等待浏览器自动打开 `http://localhost:5200`。
3. 添加图片或视频，也可以直接拖入整个文件夹。
4. 选择质量、导入选项和输出目录。
5. 点击“一键转换”。

服务默认使用端口 `5200`。如需换端口，可以在 PowerShell 中执行：

```powershell
$env:PORT = "5201"
node server.js
```

## 默认选项

默认质量是“高质量 - 无压缩 (RGBA 8888)”。

默认勾选：

- 钳制 UV

默认不勾选：

- 像素画优化 - (禁用双线形过滤)
- 没有纹理贴图
- Sprite 表单
- 裁剪透明区域

勾选“裁剪透明区域”后，页面会按每张图片的透明区域自动计算裁剪范围，填充值会写入 `.tex-json`。

## 输出结构

图片转换后通常生成：

```text
converted_output/
├─ materials/
│  ├─ <名称>.json
│  ├─ <名称>.png
│  ├─ <名称>.tex
│  └─ <名称>.tex-json
└─ models/
   └─ <名称>.json
```

视频转换后也放在 `materials/` 中，并生成 `.tex-json`、材质 `.json` 和 `models/` 里的模型 `.json`：

```text
converted_output/
├─ materials/
│  ├─ <名称>.json
│  ├─ <名称>.mp4
│  ├─ <名称>.tex
│  └─ <名称>.tex-json
└─ models/
   └─ <名称>.json
```

## 编译器路径

页面会自动查找常见位置的：

```text
wallpaper_engine\bin\resourcecompiler64.exe
```

如果 Wallpaper Engine 安装在自定义位置，可以直接在页面的 `resourcecompiler64.exe` 输入框中填写完整路径。

## 本地开发

```powershell
npm start
```

项目没有第三方 Node 依赖，只需要 Node.js 18 或更新版本。
