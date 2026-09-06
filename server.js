const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const STAGING = path.join(ROOT, '.staging');
const PORT = Number(process.env.PORT || 5200);

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tif', '.tiff']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv']);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, {
    'content-length': Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

function readBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('请求内容过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

function safeJoin(root, relativePath) {
  const normalized = path.normalize(relativePath || '').replace(/^([A-Za-z]:|[/\\])+/, '');
  const target = path.resolve(root, normalized);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('非法路径');
  }
  return target;
}

function cleanRelativePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(part => part && part !== '.' && part !== '..')
    .join('/');
}

function uniqueStem(baseName, usedStems) {
  const normalized = baseName.toLowerCase();
  if (!usedStems.has(normalized)) {
    usedStems.add(normalized);
    return baseName;
  }
  let index = 2;
  let candidate = `${baseName} (${index})`;
  while (usedStems.has(candidate.toLowerCase())) {
    index++;
    candidate = `${baseName} (${index})`;
  }
  usedStems.add(candidate.toLowerCase());
  return candidate;
}

function defaultCompilerPath() {
  const candidates = [
    'D:\\SteamLibrary\\steamapps\\common\\wallpaper_engine\\bin\\resourcecompiler64.exe',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\wallpaper_engine\\bin\\resourcecompiler64.exe',
    'D:\\Steam\\steamapps\\common\\wallpaper_engine\\bin\\resourcecompiler64.exe'
  ];
  return candidates.find(file => fs.existsSync(file)) || candidates[0];
}

function jsonText(value) {
  return JSON.stringify(value, null, '\t') + '\n';
}

function buildTexJson(options) {
  const format = options.quality || 'rgba8888';
  const result = {
    bleedtransparentcolors: true,
    clampuvs: Boolean(options.clampuvs),
    format,
    halfmip: true,
    nonpoweroftwo: true
  };

  if (options.nointerpolation) {
    result.nointerpolation = true;
  }
  if (options.nomip) {
    result.nomip = true;
  } else if (options.nointerpolation) {
    result.nomip = false;
  }

  if (options.spritesheet) {
    result.spritesheet = true;
    result.spritesheetsequences = [{
      duration: Number(options.spriteDuration) || 1,
      frames: Math.max(1, Number(options.spriteFrames) || 1),
      height: Math.max(1, Number(options.spriteHeight) || 64),
      width: Math.max(1, Number(options.spriteWidth) || 64)
    }];
  }

  if (options.croptransparent) {
    result.croptransparent = true;
    result.croppadding = Math.max(0, Number(options.croppadding) || 0);
    if (Number.isFinite(options.cropx0)) result.cropx0 = Math.max(0, Math.floor(options.cropx0));
    if (Number.isFinite(options.cropy0)) result.cropy0 = Math.max(0, Math.floor(options.cropy0));
    if (Number.isFinite(options.cropx1)) result.cropx1 = Math.max(0, Math.floor(options.cropx1));
    if (Number.isFinite(options.cropy1)) result.cropy1 = Math.max(0, Math.floor(options.cropy1));
  }

  return result;
}

function materialJson(baseName, options) {
  const pass = {
    blending: 'translucent',
    combos: {},
    cullmode: 'nocull',
    depthtest: 'disabled',
    depthwrite: 'disabled',
    shader: 'genericimage4',
    textures: [baseName]
  };
  if (options.spritesheet) pass.combos.spritesheet = 1;
  return { passes: [pass] };
}

function modelJson(relativeMaterialPath) {
  return {
    autosize: false,
    material: relativeMaterialPath
  };
}

function runCompiler(compilerPath, args, cwd, timeoutMs = 120000) {
  return new Promise(resolve => {
  const child = spawn(compilerPath, args, {
    cwd,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
    let output = '';
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill();
        resolve({ code: -1, output: `${output}\n转换超时（${timeoutMs / 1000} 秒）。` });
      }
    }, timeoutMs);

    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', error => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ code: -1, output: `${output}\n${error.message}` });
      }
    });
    child.on('exit', code => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ code, output });
      }
    });
  });
}

async function copyFile(source, target) {
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.copyFile(source, target);
}

async function convertImage(item, body, dirs, results, usedStems) {
  const source = safeJoin(path.join(STAGING, body.session), item.relativePath);
  const relative = cleanRelativePath(item.relativePath);
  if (!relative) throw new Error('文件路径为空');

  const ext = path.extname(relative).toLowerCase();
  const baseName = uniqueStem(path.basename(relative, ext), usedStems);
  const materialRelative = `materials/${baseName}`;
  const materialPath = path.join(dirs.materials, baseName);
  const modelPath = path.join(dirs.models, baseName);

  await fsp.mkdir(path.dirname(materialPath), { recursive: true });
  await fsp.mkdir(path.dirname(modelPath), { recursive: true });
  await copyFile(source, `${materialPath}${ext}`);

  const texJsonPath = `${materialPath}.tex-json`;
  const options = { ...body.options, ...(item.crop || {}) };
  await fsp.writeFile(texJsonPath, jsonText(buildTexJson(options)), 'utf8');
  await fsp.writeFile(`${materialPath}.json`, jsonText(materialJson(baseName, body.options)), 'utf8');
  await fsp.writeFile(`${modelPath}.json`, jsonText(modelJson(`${materialRelative}.json`)), 'utf8');

  const compilerPath = body.compilerPath || defaultCompilerPath();
  const texPath = `${materialPath}.tex`;
  if (!fs.existsSync(compilerPath)) {
    return {
      file: relative,
      status: 'partial',
      message: '已生成 JSON / tex-json，但未找到 resourcecompiler64.exe。'
    };
  }

  const run = await runCompiler(compilerPath, [
    '-tex',
    '-i', `${materialPath}${ext}`,
    '-o', texPath
  ], path.dirname(materialPath));

  if (run.code === 0 && fs.existsSync(texPath)) {
    results.push(`${relative}: 转换成功`);
    return { file: relative, status: 'success' };
  }

  results.push(`${relative}: 编译失败 (${run.code})`);
  results.push(run.output.trim() || '编译器没有返回详细信息。');
  return {
    file: relative,
    status: 'failed',
    message: `编译器退出码 ${run.code}`,
    detail: run.output
  };
}

async function convertVideo(item, body, dirs, results, usedStems) {
  const source = safeJoin(path.join(STAGING, body.session), item.relativePath);
  const relative = cleanRelativePath(item.relativePath);
  if (!relative) throw new Error('文件路径为空');

  const ext = path.extname(relative).toLowerCase();
  const baseName = uniqueStem(path.basename(relative, ext), usedStems);
  const materialRelative = `materials/${baseName}`;
  const materialPath = path.join(dirs.materials, baseName);
  const modelPath = path.join(dirs.models, baseName);
  await fsp.mkdir(path.dirname(materialPath), { recursive: true });
  await fsp.mkdir(path.dirname(modelPath), { recursive: true });
  await copyFile(source, `${materialPath}${ext}`);

  await fsp.writeFile(`${materialPath}.tex-json`, jsonText(buildTexJson(body.options)), 'utf8');
  await fsp.writeFile(`${materialPath}.json`, jsonText(materialJson(baseName, {})), 'utf8');
  await fsp.writeFile(`${modelPath}.json`, jsonText(modelJson(`${materialRelative}.json`)), 'utf8');

  const compilerPath = body.compilerPath || defaultCompilerPath();
  const texPath = `${materialPath}.tex`;
  if (!fs.existsSync(compilerPath)) {
    return {
      file: relative,
      status: 'partial',
      message: '已生成视频 JSON / tex-json，但未找到 resourcecompiler64.exe。'
    };
  }

  const run = await runCompiler(compilerPath, [
    '-tex',
    '-i', `${materialPath}${ext}`,
    '-o', texPath
  ], path.dirname(materialPath));

  if (run.code === 0 && fs.existsSync(texPath)) {
    results.push(`${relative}: 视频转换成功`);
    return { file: relative, status: 'success' };
  }

  results.push(`${relative}: 视频编译失败 (${run.code})`);
  results.push(run.output.trim() || '编译器没有返回详细信息。');
  return {
    file: relative,
    status: 'failed',
    message: `视频编译器退出码 ${run.code}`,
    detail: run.output
  };
}

async function handleConvert(req, res) {
  const body = await readJson(req);
  if (!body.session || !Array.isArray(body.files) || !body.files.length) {
    send(res, 400, { ok: false, error: '没有可转换的文件。' });
    return;
  }

  const sessionDir = safeJoin(STAGING, body.session);
  const outputDir = path.resolve(body.outputDir || path.join(ROOT, 'converted_output'));
  const dirs = {
    root: outputDir,
    materials: path.join(outputDir, 'materials'),
    models: path.join(outputDir, 'models')
  };
  await fsp.mkdir(dirs.materials, { recursive: true });
  await fsp.mkdir(dirs.models, { recursive: true });

    const results = [];
    const files = [];
    const usedStems = new Set();
    try {
      for (const item of body.files) {
        try {
          const relative = cleanRelativePath(item.relativePath);
          const ext = path.extname(relative).toLowerCase();
          if (imageExtensions.has(ext)) {
            files.push(await convertImage(item, body, dirs, results, usedStems));
          } else if (videoExtensions.has(ext)) {
            files.push(await convertVideo(item, body, dirs, results, usedStems));
          } else {
            files.push({ file: relative, status: 'skipped', message: '不支持的文件类型。' });
          }
        } catch (error) {
          files.push({ file: item.relativePath, status: 'failed', message: error.message });
          results.push(`${item.relativePath}: ${error.message}`);
        }
      }
    } finally {
      await fsp.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
    }

  send(res, 200, {
    ok: files.some(item => item.status === 'success' || item.status === 'copied'),
    outputDir,
    files,
    log: results
  });
}

async function handleStage(req, res, url) {
  const session = url.searchParams.get('session') || '';
  const relative = cleanRelativePath(url.searchParams.get('relative'));
  if (!/^[0-9a-f-]{8,64}$/i.test(session) || !relative) {
    send(res, 400, { ok: false, error: '导入参数无效。' });
    return;
  }

  const target = safeJoin(path.join(STAGING, session), relative);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const stream = fs.createWriteStream(target);
  req.pipe(stream);
  stream.on('finish', () => send(res, 200, { ok: true }));
  stream.on('error', error => send(res, 500, { ok: false, error: error.message }));
  req.on('error', () => stream.destroy());
}

function serveStatic(req, res, pathname) {
  const file = pathname === '/' ? '/index.html' : pathname;
  const target = safeJoin(path.join(ROOT, 'public'), file);
  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, 'Not Found', { 'content-type': 'text/plain; charset=utf-8' });
      return;
    }
    send(res, 200, data, { 'content-type': mimeTypes[path.extname(target)] || 'application/octet-stream' });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/config') {
      const compilerPath = defaultCompilerPath();
      send(res, 200, { compilerPath, compilerFound: fs.existsSync(compilerPath) });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/stage') {
      await handleStage(req, res, url);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/convert') {
      await handleConvert(req, res);
      return;
    }
    if (req.method === 'GET') {
      serveStatic(req, res, url.pathname);
      return;
    }
    send(res, 404, { ok: false });
  } catch (error) {
    send(res, 500, { ok: false, error: error.message });
  }
});

function openInBrowser(url) {
  if (process.platform !== 'win32') {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('cmd.exe', ['/d', '/s', '/c', 'start', '', url], {
    stdio: 'ignore',
    windowsHide: true
  }).on('error', error => console.error(error.message));
}

async function openExistingConverter() {
  const url = `http://localhost:${PORT}`;
  const shouldOpen = process.argv.includes('--open') || process.env.OPEN_BROWSER === '1';
  try {
    const response = await fetch(`${url}/api/config`, {
      signal: AbortSignal.timeout(1500)
    });
    if (response.ok) {
      console.log(`端口 ${PORT} 已有转换器在运行：${url}`);
      if (shouldOpen) openInBrowser(url);
      return;
    }
  } catch {
    // Fall through to the port conflict message.
  }
  console.error(`端口 ${PORT} 被其他程序占用。请关闭该程序，或用 PORT=5201 启动。`);
  process.exitCode = 1;
}

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    openExistingConverter();
    return;
  }
  console.error(error);
  process.exitCode = 1;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Wallpaper Engine 转换器已启动：http://localhost:${PORT}`);
  if (process.argv.includes('--open') || process.env.OPEN_BROWSER === '1') {
    openInBrowser(`http://localhost:${PORT}`);
  }
});
