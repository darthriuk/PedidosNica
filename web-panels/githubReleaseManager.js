const fs = require('fs');
const path = require('path');
const { generateApkAssets, compileApksLocally } = require('./buildLocalApks');

const ROOT_DIR = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');
const GITHUB_REPO = 'darthriuk/PedidosNica';

function readVersionInfo() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    }
  } catch (_) {}
  return {
    version: '1.1.0',
    versionCode: 2,
    tag: 'v1.1.0',
    releasedAt: new Date().toISOString(),
    repo: GITHUB_REPO,
    lanUrl: 'http://192.168.1.20:3000',
    tunnelUrl: 'https://1de3b77b254e8b.lhr.life',
    changelog: 'Versión 1.1.0: Build Local 100% empaquetado dentro del APK (0 errores de túnel) + sincronización LAN y auto-actualización.',
    assets: {
      client: `https://github.com/${GITHUB_REPO}/releases/latest/download/PedidosNica-Cliente.apk`,
      driver: `https://github.com/${GITHUB_REPO}/releases/latest/download/PedidosNica-Repartidor.apk`,
      restaurant: `https://github.com/${GITHUB_REPO}/releases/latest/download/PedidosNica-Restaurante.apk`
    }
  };
}

function writeVersionInfo(info) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(info, null, 2), 'utf8');
  return info;
}

async function githubRequest(endpoint, method = 'GET', body = null, token = process.env.GITHUB_TOKEN, extraHeaders = {}) {
  const headers = Object.assign({
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'PedidosNica-Release-Engine'
  }, extraHeaders);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const isBuffer = Buffer.isBuffer(body);
  if (body && !isBuffer && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? (isBuffer ? body : JSON.stringify(body)) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`GitHub API ${method} ${endpoint} failed (${res.status}): ${data?.message || text}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function collectProjectFiles() {
  const filesToSync = [];

  const allowDirs = [
    '.github',
    'android-apps',
    'docs',
    'web-panels',
    'backend/osrm-dispatch/src',
    'client-app',
    'driver-app',
    'supabase'
  ];

  const rootFiles = ['README.md', 'version.json'];
  for (const rf of rootFiles) {
    const full = path.join(ROOT_DIR, rf);
    if (fs.existsSync(full)) {
      filesToSync.push({ relPath: rf.replace(/\\/g, '/'), fullPath: full });
    }
  }

  function walkDir(relDir) {
    const absDir = path.join(ROOT_DIR, relDir);
    if (!fs.existsSync(absDir)) return;
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = path.join(relDir, entry.name).replace(/\\/g, '/');
      const entryAbs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'build', '.gradle', 'dist', '.next', '.android-toolchain'].includes(entry.name)) continue;
        walkDir(entryRel);
      } else if (entry.isFile()) {
        if (entry.name === '.env' || entry.name === '.env.local' || entry.name.endsWith('.apk') || entry.name.endsWith('.log')) continue;
        filesToSync.push({ relPath: entryRel, fullPath: entryAbs });
      }
    }
  }

  for (const d of allowDirs) {
    walkDir(d);
  }

  return filesToSync;
}

async function publishLocalReleaseToGitHub(token, versionInfo, compiledApks) {
  const tag = versionInfo.tag;
  const title = `PedidosNica ${tag} — Build Local Empaquetado (Cliente, Repartidor y Restaurante)`;
  const body = [
    `## 🚀 PedidosNica Ecosystem — Release ${tag}`,
    ``,
    versionInfo.changelog,
    ``,
    `### 📲 Descarga Directa de Aplicaciones Android (.APK Compiladas Localmente)`,
    `- **🍔 App de Clientes (Comensales):** \`PedidosNica-Cliente.apk\` (\`com.pedidosnica.client\`)`,
    `- **🛵 App de Repartidores (Drivers):** \`PedidosNica-Repartidor.apk\` (\`com.pedidosnica.driver\`)`,
    `- **🏪 Suite de Restaurante (KDS & Menú):** \`PedidosNica-Restaurante.apk\` (\`com.pedidosnica.restaurant\`)`,
    ``,
    `> Todas las aplicaciones incluyen el Build Local completo empaquetado en \`assets/\` (0 errores de túnel) y detectan nuevas versiones automáticamente.`
  ].join('\n');

  let release;
  try {
    release = await githubRequest(`/repos/${GITHUB_REPO}/releases/tags/${tag}`, 'GET', null, token);
    release = await githubRequest(`/repos/${GITHUB_REPO}/releases/${release.id}`, 'PATCH', {
      tag_name: tag,
      name: title,
      body,
      draft: false,
      prerelease: false
    }, token);
  } catch (err) {
    if (err.status === 404) {
      release = await githubRequest(`/repos/${GITHUB_REPO}/releases`, 'POST', {
        tag_name: tag,
        target_commitish: 'main',
        name: title,
        body,
        draft: false,
        prerelease: false
      }, token);
    } else {
      throw err;
    }
  }

  // Eliminar assets existentes con el mismo nombre si se está actualizando el mismo tag
  const existingAssets = Array.isArray(release.assets) ? release.assets : [];
  const filesToUpload = [
    ...compiledApks.map(a => ({ name: a.name, filePath: a.path, contentType: 'application/vnd.android.package-archive' })),
    { name: 'version.json', filePath: VERSION_FILE, contentType: 'application/json' }
  ];

  for (const item of filesToUpload) {
    const prev = existingAssets.find(a => a.name === item.name);
    if (prev) {
      await githubRequest(`/repos/${GITHUB_REPO}/releases/assets/${prev.id}`, 'DELETE', null, token);
    }
    const fileBuf = fs.readFileSync(item.filePath);
    const uploadUrl = `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${release.id}/assets?name=${encodeURIComponent(item.name)}`;
    await githubRequest(uploadUrl, 'POST', fileBuf, token, {
      'Content-Type': item.contentType,
      'Content-Length': String(fileBuf.length)
    });
  }

  return release;
}

async function syncProjectAndTriggerBuild({ token, newVersion, changelog, lanUrl, tunnelUrl }) {
  if (!token) {
    throw new Error('Se requiere GITHUB_TOKEN para sincronizar con GitHub.');
  }

  // 1. Actualizar version.json antes de compilar localmente para que el APK lleve el nuevo versionName y versionCode
  const current = readVersionInfo();
  if (newVersion && newVersion !== current.version) {
    current.version = newVersion.replace(/^v/i, '');
    current.versionCode = Number(current.versionCode || 1) + 1;
    current.tag = `v${current.version}`;
  }
  if (changelog) current.changelog = changelog;
  if (lanUrl) current.lanUrl = lanUrl;
  if (tunnelUrl) current.tunnelUrl = tunnelUrl;
  current.releasedAt = new Date().toISOString();
  writeVersionInfo(current);

  // 2. SIEMPRE EJECUTAR EL BUILD LOCAL PRIMERO (Generar assets HTML/JS + Compilar APKs con Gradle local)
  console.log('[1/4] Empaquetando HTML/JS y base de datos local dentro de android-apps/app/src/main/assets/...');
  const bundledAssets = await generateApkAssets('http://127.0.0.1:3000', current.lanUrl);

  console.log('[2/4] Compilando los 3 APKs localmente en esta PC...');
  const compiledApks = compileApksLocally();

  // 3. Subir código fuente y assets compilados a la rama main de GitHub
  console.log('[3/4] Subiendo código fuente y assets al repositorio GitHub...');
  let headSha = null;
  let baseTreeSha = null;
  const refData = await githubRequest(`/repos/${GITHUB_REPO}/git/ref/heads/main`, 'GET', null, token);
  headSha = refData.object.sha;
  const commitData = await githubRequest(`/repos/${GITHUB_REPO}/git/commits/${headSha}`, 'GET', null, token);
  baseTreeSha = commitData.tree.sha;

  const files = collectProjectFiles();
  const treeItems = [];

  for (const file of files) {
    const rawBuffer = fs.readFileSync(file.fullPath);
    const blobRes = await githubRequest(`/repos/${GITHUB_REPO}/git/blobs`, 'POST', {
      content: rawBuffer.toString('base64'),
      encoding: 'base64'
    }, token);
    treeItems.push({
      path: file.relPath,
      mode: '100644',
      type: 'blob',
      sha: blobRes.sha
    });
  }

  const newTree = await githubRequest(`/repos/${GITHUB_REPO}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems
  }, token);

  const commitMessage = `Release ${current.tag} (Local Build): ${current.changelog}`;
  const newCommit = await githubRequest(`/repos/${GITHUB_REPO}/git/commits`, 'POST', {
    message: commitMessage,
    tree: newTree.sha,
    parents: [headSha]
  }, token);

  await githubRequest(`/repos/${GITHUB_REPO}/git/refs/heads/main`, 'PATCH', {
    sha: newCommit.sha,
    force: true
  }, token);

  // 4. Subir los 3 archivos .APK compilados localmente directo a GitHub Releases y activar GitHub Pages (/docs)
  console.log('[4/4] Publicando Release, activando GitHub Pages y subiendo APKs compilados localmente...');
  const release = await publishLocalReleaseToGitHub(token, current, compiledApks);

  try {
    await githubRequest(`/repos/${GITHUB_REPO}/pages`, 'POST', {
      source: { branch: 'main', path: '/docs' }
    }, token);
  } catch (_) {}

  return {
    success: true,
    versionInfo: current,
    commitSha: newCommit.sha,
    filesUploaded: files.length,
    bundledAssets,
    compiledApks,
    releaseUrl: release.html_url,
    webPagesUrl: 'https://darthriuk.github.io/PedidosNica/',
    repoUrl: `https://github.com/${GITHUB_REPO}`,
    actionsUrl: `https://github.com/${GITHUB_REPO}/actions`,
    releasesUrl: `https://github.com/${GITHUB_REPO}/releases`
  };
}

module.exports = {
  GITHUB_REPO,
  readVersionInfo,
  writeVersionInfo,
  syncProjectAndTriggerBuild,
  githubRequest
};
