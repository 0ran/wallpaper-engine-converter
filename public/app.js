const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const pickFilesButton = document.getElementById('pickFilesButton');
const pickFolderButton = document.getElementById('pickFolderButton');
const clearFilesButton = document.getElementById('clearFilesButton');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const emptyText = document.getElementById('emptyText');
const queueSummary = document.getElementById('queueSummary');
const convertButton = document.getElementById('convertButton');
const progress = document.getElementById('progress');
const log = document.getElementById('log');
const outputDir = document.getElementById('outputDir');
const compilerPath = document.getElementById('compilerPath');
const spriteFields = document.getElementById('spriteFields');
const cropFields = document.getElementById('cropFields');
const langToggle = document.getElementById('langToggle');
const themeToggle = document.getElementById('themeToggle');

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tif', '.tiff']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv']);
const state = [];

const savedLang = localStorage.getItem('dtex-lang');
let currentLang = savedLang === 'zh' || savedLang === 'en'
  ? savedLang
  : ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
let currentTheme = document.documentElement.dataset.theme || 'dark';

const translations = {
  zh: {
    pageTitle: 'Wallpaper Engine 转换器',
    toolbarAria: '导入操作',
    brandTitleA: 'WALLPAPER',
    brandTitleB: 'ENGINE',
    brandSubtitle: '转换器',
    addFiles: '添加图片 / 视频',
    addFolder: '批量导入文件夹',
    clear: '清空',
    localBadge: '本地处理',
    localBadgeHint: '图片仅在本地浏览器中处理，不会上传至服务器',
    langSwitch: '切换到英文',
    langLabel: 'EN',
    themeSwitch: '切换明暗主题',
    themeToLight: '浅色',
    themeToDark: '深色',
    github: '前往 GitHub 主页',
    githubTitle: 'GitHub',
    bilibili: '前往 Bilibili 主页',
    bilibiliTitle: 'Bilibili',
    sceneJsonNotice: '转换生成的内容不会自动显示为场景图层，请在 scene.json 项目中手动添加对应的资源引用。',
    queueTitle: '导入队列',
    settingsTitle: '导入设置',
    logTitle: '转换日志',
    clearLog: '清空日志',
    emptyText: '把图片、视频或整个文件夹拖到这里，或使用上方按钮导入。',
    quality: '质量',
    qualityRgba: '高质量 - 无压缩 (RGBA 8888)',
    qualityDxt5: '较好性能 - 轻微压缩 (DXT5)',
    qualityDxt1: '高效能 - 中等压缩等级 (DXT1)',
    options: '选项',
    pixelArt: '像素画优化 - (禁用双线形过滤)',
    noMip: '没有纹理贴图',
    clampUV: '钳制 UV',
    spriteSheet: 'Sprite 表单',
    cropTransparent: '裁剪透明区域',
    spriteFrames: '帧数',
    spriteDuration: '时长',
    spriteWidth: '帧宽',
    spriteHeight: '帧高',
    cropPadding: '填充',
    cropHint: '裁剪坐标会按每张图片的透明区域自动计算。',
    outputDir: '输出目录',
    convertButton: '一键转换',
    progressWaiting: '等待导入文件。',
    kindImage: '图片',
    kindVideo: '视频',
    kindOther: '忽略',
    statusWaiting: '等待转换',
    statusUploading: '导入中',
    statusSuccess: '成功',
    statusCopied: '已复制',
    statusPartial: '部分完成',
    statusFailed: '失败',
    statusSkipped: '跳过',
    queueSummary: '{images} 张图片，{videos} 个视频',
    removeTitle: '移除 {name}',
    uploadFailed: '导入 {name} 失败',
    addFilesFirst: '请先添加图片或视频。',
    importingFile: '导入文件 {index} / {total}',
    converting: '正在转换，请稍候。',
    conversionFailed: '转换失败',
    outputDirLog: '输出目录：{path}',
    conversionDone: '转换完成。',
    conversionDoneWarnings: '转换完成，但部分文件需要检查。',
    conversionFailedLog: '转换失败。',
    compilerFound: '已找到 Wallpaper Engine 编译器。',
    compilerMissing: '未找到 Wallpaper Engine 编译器，请手动填写路径。',
    configReadFailed: '读取本地配置失败。',
    serverMessages: {}
  },
  en: {
    pageTitle: 'Wallpaper Engine Converter',
    toolbarAria: 'Import actions',
    brandTitleA: 'WALLPAPER',
    brandTitleB: 'ENGINE',
    brandSubtitle: 'Converter',
    addFiles: 'Add Images / Videos',
    addFolder: 'Import Folder',
    clear: 'Clear',
    localBadge: 'Local Processing',
    localBadgeHint: 'Images are processed locally in your browser and never uploaded to a server.',
    langSwitch: 'Switch to Chinese',
    langLabel: '中',
    themeSwitch: 'Toggle light / dark theme',
    themeToLight: 'Light',
    themeToDark: 'Dark',
    github: 'Open GitHub profile',
    githubTitle: 'GitHub',
    bilibili: 'Open Bilibili profile',
    bilibiliTitle: 'Bilibili',
    sceneJsonNotice: 'Generated content is not automatically displayed as scene layers. Add the corresponding resource references manually in your scene.json project.',
    queueTitle: 'Import Queue',
    settingsTitle: 'Import Settings',
    logTitle: 'Conversion Log',
    clearLog: 'Clear Log',
    emptyText: 'Drop images, videos, or an entire folder here, or use the buttons above to import.',
    quality: 'Quality',
    qualityRgba: 'High quality - uncompressed (RGBA 8888)',
    qualityDxt5: 'Better performance - light compression (DXT5)',
    qualityDxt1: 'High performance - medium compression (DXT1)',
    options: 'Options',
    pixelArt: 'Pixel art optimization - (disable bilinear filtering)',
    noMip: 'No texture mipmaps',
    clampUV: 'Clamp UV',
    spriteSheet: 'Sprite sheet',
    cropTransparent: 'Crop transparent area',
    spriteFrames: 'Frames',
    spriteDuration: 'Duration',
    spriteWidth: 'Frame width',
    spriteHeight: 'Frame height',
    cropPadding: 'Padding',
    cropHint: 'Crop bounds are calculated automatically from each image\u2019s transparent area.',
    outputDir: 'Output directory',
    convertButton: 'Convert Now',
    progressWaiting: 'Waiting for files.',
    kindImage: 'Image',
    kindVideo: 'Video',
    kindOther: 'Skipped',
    statusWaiting: 'Waiting',
    statusUploading: 'Importing',
    statusSuccess: 'Success',
    statusCopied: 'Copied',
    statusPartial: 'Partial',
    statusFailed: 'Failed',
    statusSkipped: 'Skipped',
    queueSummary: '{images} images, {videos} videos',
    removeTitle: 'Remove {name}',
    uploadFailed: 'Importing {name} failed',
    addFilesFirst: 'Add images or videos first.',
    importingFile: 'Importing file {index} / {total}',
    converting: 'Converting, please wait.',
    conversionFailed: 'Conversion failed',
    outputDirLog: 'Output directory: {path}',
    conversionDone: 'Conversion complete.',
    conversionDoneWarnings: 'Conversion complete, but some files need attention.',
    conversionFailedLog: 'Conversion failed.',
    compilerFound: 'Wallpaper Engine compiler found.',
    compilerMissing: 'Wallpaper Engine compiler not found. Fill in the path manually.',
    configReadFailed: 'Failed to read local configuration.',
    serverMessages: {
      '请求内容过大': 'Request body too large.',
      '非法路径': 'Invalid path.',
      '文件路径为空': 'File path is empty.',
      '没有可转换的文件。': 'No files to convert.',
      '导入参数无效。': 'Invalid import parameters.',
      '不支持的文件类型。': 'Unsupported file type.',
      '已生成 JSON / tex-json，但未找到 resourcecompiler64.exe。': 'Generated JSON / tex-json, but resourcecompiler64.exe was not found.',
      '已生成视频 JSON / tex-json，但未找到 resourcecompiler64.exe。': 'Generated video JSON / tex-json, but resourcecompiler64.exe was not found.',
      '编译器没有返回详细信息。': 'The compiler returned no details.',
      '转换成功': 'converted successfully',
      '视频转换成功': 'video converted successfully',
      '编译失败': 'compile failed',
      '视频编译失败': 'video compile failed'
    }
  }
};

let progressKey = 'progressWaiting';
let progressVars = null;

function t(key, vars) {
  let value = translations[currentLang][key] || translations.zh[key] || key;
  if (vars) {
    for (const [name, val] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val));
    }
  }
  return value;
}

function translateServerText(text) {
  if (!text || currentLang === 'zh') return text;
  let result = String(text);
  result = result.replace(/编译器退出码 (\d+)/g, 'Compiler exit code $1');
  result = result.replace(/视频编译器退出码 (\d+)/g, 'Video compiler exit code $1');
  result = result.replace(/转换超时（(\d+) 秒）。/g, 'Conversion timed out ($1 seconds).');
  for (const [zhPhrase, enPhrase] of Object.entries(translations.en.serverMessages)) {
    result = result.split(zhPhrase).join(enPhrase);
  }
  return result;
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;
  localStorage.setItem('dtex-theme', currentTheme);
  updateThemeToggleLabel();
}

function updateThemeToggleLabel() {
  document.getElementById('themeToggleLabel').textContent = t(currentTheme === 'dark' ? 'themeToLight' : 'themeToDark');
}

function setProgress(key, vars) {
  progressKey = key;
  progressVars = vars || null;
  progress.textContent = t(key, vars);
}

function applyI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
  setProgress(progressKey, progressVars);
  renderFiles();
  updateThemeToggleLabel();
}

function extension(name) {
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index).toLowerCase();
}

function isImage(item) {
  return item.file.type.startsWith('image/') || imageExtensions.has(extension(item.file.name));
}

function isVideo(item) {
  return item.file.type.startsWith('video/') || videoExtensions.has(extension(item.file.name));
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function kindLabel(item) {
  if (isImage(item)) return t('kindImage');
  if (isVideo(item)) return t('kindVideo');
  return t('kindOther');
}

function statusLabel(status) {
  const keys = {
    waiting: 'statusWaiting',
    uploading: 'statusUploading',
    success: 'statusSuccess',
    copied: 'statusCopied',
    partial: 'statusPartial',
    failed: 'statusFailed',
    skipped: 'statusSkipped'
  };
  return keys[status] ? t(keys[status]) : status;
}

function addFiles(files) {
  let added = 0;
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    if (!imageExtensions.has(extension(file.name)) && !videoExtensions.has(extension(file.name))) continue;
    const existing = state.find(item => item.relativePath === relativePath);
    if (existing) {
      existing.file = file;
      existing.status = 'waiting';
      existing.crop = null;
    } else {
      state.push({
        id: crypto.randomUUID(),
        file,
        relativePath,
        status: 'waiting',
        crop: null
      });
    }
    added++;
  }
  if (added) renderFiles();
}

function renderFiles() {
  fileList.textContent = '';
  const images = state.filter(isImage).length;
  const videos = state.filter(isVideo).length;
  queueSummary.textContent = t('queueSummary', { images, videos });
  emptyText.classList.toggle('hidden', state.length > 0);

  for (const item of state) {
    const row = document.createElement('li');
    row.className = 'file-item';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = item.relativePath;
    name.title = item.relativePath;

    const kind = document.createElement('div');
    kind.className = 'file-kind';
    kind.textContent = kindLabel(item);

    const status = document.createElement('div');
    status.className = `file-status ${item.status}`;
    status.textContent = statusLabel(item.status);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-file';
    remove.textContent = '×';
    remove.title = t('removeTitle', { name: item.relativePath });
    remove.addEventListener('click', () => {
      const index = state.indexOf(item);
      if (index !== -1) state.splice(index, 1);
      renderFiles();
    });

    row.append(name, kind, status, remove);
    fileList.append(row);
  }
}

function setItemStatus(relativePath, status) {
  const item = state.find(entry => entry.relativePath === relativePath);
  if (!item) return;
  item.status = status;
  renderFiles();
}

function appendLog(text) {
  const locale = currentLang === 'zh' ? 'zh-CN' : 'en-GB';
  const stamp = new Date().toLocaleTimeString(locale, { hour12: false });
  log.textContent += `[${stamp}] ${text}\n`;
  log.scrollTop = log.scrollHeight;
}

function getOptions() {
  const cropTransparent = document.getElementById('cropTransparent').checked;
  const spriteSheet = document.getElementById('spriteSheet').checked;
  return {
    quality: document.getElementById('quality').value,
    nointerpolation: document.getElementById('pixelArt').checked,
    nomip: document.getElementById('noMip').checked,
    clampuvs: document.getElementById('clampUV').checked,
    spritesheet: spriteSheet,
    spriteFrames: Number(document.getElementById('spriteFrames').value) || 1,
    spriteDuration: Number(document.getElementById('spriteDuration').value) || 1,
    spriteWidth: Number(document.getElementById('spriteWidth').value) || 64,
    spriteHeight: Number(document.getElementById('spriteHeight').value) || 64,
    croptransparent: cropTransparent,
    croppadding: Number(document.getElementById('cropPadding').value) || 0
  };
}

async function computeCrop(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  let x0 = canvas.width;
  let y0 = canvas.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }

  bitmap.close();
  if (x1 === -1) return null;
  return { cropx0: x0, cropy0: y0, cropx1: x1 + 1, cropy1: y1 + 1 };
}

async function uploadFile(item, sessionId) {
  setItemStatus(item.relativePath, 'uploading');
  const query = new URLSearchParams({ session: sessionId, relative: item.relativePath });
  const response = await fetch(`/api/stage?${query}`, {
    method: 'POST',
    body: item.file
  });
  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      message = JSON.parse(raw).error || raw;
    } catch (error) {
      message = raw;
    }
    throw new Error(translateServerText(message || t('uploadFailed', { name: item.relativePath })));
  }
}

async function convert() {
  const usable = state.filter(item => isImage(item) || isVideo(item));
  if (!usable.length) {
    setProgress('addFilesFirst');
    return;
  }

  convertButton.disabled = true;
  const sessionId = crypto.randomUUID();
  const options = getOptions();
  try {
    for (const [index, item] of usable.entries()) {
      setProgress('importingFile', { index: index + 1, total: usable.length });
      await uploadFile(item, sessionId);
      if (options.croptransparent && isImage(item)) {
        item.crop = await computeCrop(item.file);
      }
    }

    setProgress('converting');
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session: sessionId,
        outputDir: outputDir.value.trim(),
        compilerPath: compilerPath.value.trim(),
        options,
        files: usable.map(item => ({
          relativePath: item.relativePath,
          crop: item.crop
        }))
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(translateServerText(result.error || t('conversionFailed')));
    for (const item of result.files || []) {
      setItemStatus(item.file, item.status);
    }
    for (const line of result.log || []) appendLog(translateServerText(line));
    appendLog(t('outputDirLog', { path: result.outputDir }));
    setProgress(result.ok ? 'conversionDone' : 'conversionDoneWarnings');
  } catch (error) {
    appendLog(translateServerText(error.message));
    setProgress('conversionFailedLog');
  } finally {
    convertButton.disabled = false;
  }
}

async function scanEntry(entry, output = []) {
  if (!entry) return output;
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    Object.defineProperty(file, 'webkitRelativePath', {
      value: entry.fullPath.replace(/^\//, ''),
      configurable: true
    });
    output.push(file);
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let entries = [];
    do {
      entries = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      for (const child of entries) await scanEntry(child, output);
    } while (entries.length);
  }
  return output;
}

pickFilesButton.addEventListener('click', () => fileInput.click());
pickFolderButton.addEventListener('click', () => folderInput.click());
clearFilesButton.addEventListener('click', () => {
  state.length = 0;
  renderFiles();
});
document.getElementById('clearLogButton').addEventListener('click', () => { log.textContent = ''; });
fileInput.addEventListener('change', () => {
  addFiles(fileInput.files);
  fileInput.value = '';
});
folderInput.addEventListener('change', () => {
  addFiles(folderInput.files);
  folderInput.value = '';
});
convertButton.addEventListener('click', convert);

langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('dtex-lang', currentLang);
  applyI18n();
});

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme();
});

document.getElementById('spriteSheet').addEventListener('change', event => {
  spriteFields.classList.toggle('hidden', !event.target.checked);
});
document.getElementById('cropTransparent').addEventListener('change', event => {
  cropFields.classList.toggle('hidden', !event.target.checked);
});

dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', async event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const entries = Array.from(event.dataTransfer.items)
    .map(item => item.webkitGetAsEntry && item.webkitGetAsEntry())
    .filter(Boolean);
  if (!entries.length) {
    addFiles(event.dataTransfer.files);
    return;
  }
  const files = [];
  for (const entry of entries) await scanEntry(entry, files);
  addFiles(files);
});

(async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    compilerPath.value = config.compilerPath;
    appendLog(config.compilerFound ? t('compilerFound') : t('compilerMissing'));
  } catch (error) {
    appendLog(t('configReadFailed'));
  }
})();

applyTheme();
applyI18n();
