const fs = require('fs');
const path = require('path');

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
    version: '1.0.0',
    versionCode: 1,
    tag: 'v1.0.0',
    releasedAt: new Date().toISOString(),
    repo: GITHUB_REPO,
    lanUrl: 'http://192.168.1.20:3000',
    tunnelUrl: 'https://1de3b77b254e8b.lhr.life',
    changelog: 'Versión inicial 1.0.0',
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

async function githubRequest(endpoint, method = 'GET', body = null, token = process.env.GITHUB_TOKEN) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'PedidosNica-Release-Engine'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
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
        if (['node_modules', '.git', 'build', '.gradle', 'dist', '.next'].includes(entry.name)) continue;
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

async function syncProjectAndTriggerBuild({ token, newVersion, changelog, lanUrl, tunnelUrl }) {
  if (!token) {
    throw new Error('Se requiere GITHUB_TOKEN para sincronizar con GitHub.');
  }

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

  // 1. Verificar si la rama main ya existe; si el repo está vacío, inicializar con README.md
  let headSha = null;
  let baseTreeSha = null;
  try {
    const refData = await githubRequest(`/repos/${GITHUB_REPO}/git/ref/heads/main`, 'GET', null, token);
    headSha = refData.object.sha;
    const commitData = await githubRequest(`/repos/${GITHUB_REPO}/git/commits/${headSha}`, 'GET', null, token);
    baseTreeSha = commitData.tree.sha;
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      const readmeContent = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
      await githubRequest(`/repos/${GITHUB_REPO}/contents/README.md`, 'PUT', {
        message: 'Initial commit: PedidosNica Ecosystem',
        content: Buffer.from(readmeContent, 'utf8').toString('base64'),
        branch: 'main'
      }, token);
      const refData = await githubRequest(`/repos/${GITHUB_REPO}/git/ref/heads/main`, 'GET', null, token);
      headSha = refData.object.sha;
      const commitData = await githubRequest(`/repos/${GITHUB_REPO}/git/commits/${headSha}`, 'GET', null, token);
      baseTreeSha = commitData.tree.sha;
    } else {
      throw err;
    }
  }

  // 2. Subir todos los archivos como blobs y construir el árbol Git
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

  const commitMessage = `Release ${current.tag}: ${current.changelog}`;
  const newCommit = await githubRequest(`/repos/${GITHUB_REPO}/git/commits`, 'POST', {
    message: commitMessage,
    tree: newTree.sha,
    parents: [headSha]
  }, token);

  await githubRequest(`/repos/${GITHUB_REPO}/git/refs/heads/main`, 'PATCH', {
    sha: newCommit.sha,
    force: true
  }, token);

  return {
    success: true,
    versionInfo: current,
    commitSha: newCommit.sha,
    filesUploaded: files.length,
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
