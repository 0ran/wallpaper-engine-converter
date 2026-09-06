# Wallpaper Engine Converter

English | [简体中文](README.zh-CN.md)

This is a local web tool for batch-converting images and videos into a Wallpaper Engine-ready resource structure and invoking Wallpaper Engine's bundled `resourcecompiler64.exe` to generate `.tex` files.

> **Important**
>
> Generated content is not automatically displayed as scene layers. Add the corresponding resource references manually in your `scene.json` project.

## Usage

1. Run `npm start`, or double-click `start.cmd`.
2. Wait for the browser to open `http://localhost:5200`.
3. Add images or videos, or drop in an entire folder.
4. Choose quality, import options, and an output directory.
5. Click **Convert Now**.

The server uses port `5200` by default. To use a different port, run:

```powershell
$env:PORT = "5201"
node server.js
```

## Default Options

Default quality: **High quality - uncompressed (RGBA 8888)**.

Checked by default:

- Clamp UV

Unchecked by default:

- Pixel art optimization - (disable bilinear filtering)
- No texture mipmaps
- Sprite sheet
- Crop transparent area

When **Crop transparent area** is checked, the page automatically calculates crop bounds from each image's transparent area, and the padding value is written into `.tex-json`.

## Output Structure

Image conversions usually generate:

```text
converted_output/
├─ materials/
│  ├─ <name>.json
│  ├─ <name>.png
│  ├─ <name>.tex
│  └─ <name>.tex-json
└─ models/
   └─ <name>.json
```

Video conversions are also placed in `materials/`, with a `.tex-json`, a material `.json`, and a model `.json` under `models/`:

```text
converted_output/
├─ materials/
│  ├─ <name>.json
│  ├─ <name>.mp4
│  ├─ <name>.tex
│  └─ <name>.tex-json
└─ models/
   └─ <name>.json
```

## Compiler Path

The page automatically searches common locations for:

```text
wallpaper_engine\bin\resourcecompiler64.exe
```

If Wallpaper Engine is installed at a custom location, enter the full path in the `resourcecompiler64.exe` field on the page.

## Local Development

```powershell
npm start
```

The project has no third-party Node dependencies; Node.js 18 or newer is required.
