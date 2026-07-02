import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get } from 'firebase/database'
import dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getDatabase(firebaseApp)

function runGit(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

function getAllKtFiles(dir, results = []) {
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir)) {
    if (entry === 'build' || entry === '.gradle' || entry === 'node_modules') continue
    const full = join(dir, entry)
    try {
      if (statSync(full).isDirectory()) getAllKtFiles(full, results)
      else if (entry.endsWith('.kt')) results.push({ name: entry, path: full })
    } catch {}
  }
  return results
}

function safeRead(filePath) {
  try { return readFileSync(filePath, 'utf-8') } catch { return '' }
}

function scanCodeStats(repoPath) {
  const stats = {
    screenCount: 0,
    entityCount: 0,
    workerCount: 0,
    permissions: [],
    features: [],
  }

  // Kotlinファイルをスキャン
  const srcDir = join(repoPath, 'app', 'src', 'main', 'java')
  const ktFiles = getAllKtFiles(srcDir)

  for (const { name, path: filePath } of ktFiles) {
    if (name.endsWith('Screen.kt')) stats.screenCount++
    if (name.endsWith('Worker.kt')) stats.workerCount++

    // @Entity のカウント（Entityファイルのみ読む）
    if (name.endsWith('Entity.kt') || filePath.includes('database') || filePath.includes('entity')) {
      const content = safeRead(filePath)
      if (content.includes('@Entity')) stats.entityCount++
    }
  }

  // AndroidManifest.xml から権限を取得
  const manifestPath = join(repoPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  const manifest = safeRead(manifestPath)
  const permMatches = manifest.match(/uses-permission[^>]+android:name="([^"]+)"/g) || []
  stats.permissions = permMatches
    .map(p => {
      const m = p.match(/"([^"]+)"/)
      const full = m?.[1] || ''
      return full.split('.').pop()
    })
    .filter(p => p && !['RECEIVE_BOOT_COMPLETED'].includes(p))
    .slice(0, 8)

  // build.gradle.kts から機能とバージョンを取得
  const gradle = safeRead(join(repoPath, 'app', 'build.gradle.kts'))
  const versionNameMatch = gradle.match(/versionName\s*=\s*"([^"]+)"/)
  const versionCodeMatch = gradle.match(/versionCode\s*=\s*(\d+)/)
  stats.versionName = versionNameMatch?.[1] || ''
  stats.versionCode = parseInt(versionCodeMatch?.[1]) || 0

  // テストファイル数
  let testFileCount = 0
  for (const testDir of ['app/src/test', 'app/src/androidTest']) {
    testFileCount += getAllKtFiles(join(repoPath, testDir)).length
  }
  stats.testFileCount = testFileCount

  // TODO/FIXME 件数
  let todoCount = 0
  for (const { path: fp } of ktFiles) {
    const content = safeRead(fp)
    todoCount += (content.match(/\/\/\s*(TODO|FIXME)/gi) || []).length
  }
  stats.todoCount = todoCount

  // リリースビルド済みか
  const releaseBuild = getLastReleaseBuild(repoPath)
  stats.hasReleaseBuild = !!releaseBuild
  stats.lastReleaseBuild = releaseBuild || null

  const featureMap = [
    { key: 'room',           label: 'Room DB' },
    { key: 'hilt',           label: 'Hilt DI' },
    { key: 'compose',        label: 'Jetpack Compose' },
    { key: 'work',           label: 'WorkManager' },
    { key: 'crashlytics',    label: 'Crashlytics' },
    { key: 'biometric',      label: '生体認証' },
    { key: 'sqlcipher',      label: 'DB暗号化' },
    { key: 'retrofit',       label: 'Retrofit' },
    { key: 'gemini',         label: 'Gemini AI' },
    { key: 'anthropic',      label: 'Claude AI' },
    { key: 'openai',         label: 'OpenAI' },
    { key: 'navigation',     label: 'Navigation' },
    { key: 'datastore',      label: 'DataStore' },
    { key: 'camera',         label: 'CameraX' },
    { key: 'maps',           label: 'Google Maps' },
  ]
  stats.features = featureMap.filter(f => gradle.toLowerCase().includes(f.key)).map(f => f.label)

  // 署名設定ファイルの有無
  stats.hasSigningConfig = existsSync(join(repoPath, 'keystore.properties'))
  if (stats.hasSigningConfig) stats.features.push('🔑 署名設定')

  return stats
}

function getLastReleaseBuild(repoPath) {
  const targets = [
    { dir: join(repoPath, 'app', 'build', 'outputs', 'bundle', 'release'), ext: '.aab', type: 'AAB' },
    { dir: join(repoPath, 'app', 'build', 'outputs', 'apk',    'release'), ext: '.apk', type: 'APK' },
  ]
  let latest = null
  for (const { dir, ext, type } of targets) {
    if (!existsSync(dir)) continue
    try {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(ext)) continue
        const mtime = statSync(join(dir, file)).mtime
        if (!latest || mtime > new Date(latest.isoDate)) {
          latest = { isoDate: mtime.toISOString(), type, fileName: file }
        }
      }
    } catch {}
  }
  return latest
}

function getUncommittedCount(repoPath) {
  const status = runGit('status --porcelain', repoPath)
  return status ? status.split('\n').filter(Boolean).length : 0
}

function getAppIcon(repoPath) {
  const resDir = join(repoPath, 'app', 'src', 'main', 'res')
  for (const dpi of ['mipmap-mdpi', 'mipmap-hdpi']) {
    for (const ext of ['webp', 'png']) {
      const iconPath = join(resDir, dpi, `ic_launcher.${ext}`)
      if (existsSync(iconPath)) {
        try {
          const buf = readFileSync(iconPath)
          const mime = ext === 'webp' ? 'image/webp' : 'image/png'
          return `data:${mime};base64,${buf.toString('base64')}`
        } catch {}
      }
    }
  }
  return ''
}

function getRepoInfo(repoPath) {
  const name = repoPath.split(/[\\/]/).pop()
  const branch = runGit('rev-parse --abbrev-ref HEAD', repoPath)
  const remoteUrl = runGit('remote get-url origin', repoPath)
  const isOnGitHub = remoteUrl.includes('github.com')

  let aheadCount = 0
  let behindCount = 0
  if (isOnGitHub || remoteUrl) {
    const ahead = runGit('rev-list --count @{u}..HEAD 2>nul', repoPath)
    const behind = runGit('rev-list --count HEAD..@{u} 2>nul', repoPath)
    aheadCount = parseInt(ahead) || 0
    behindCount = parseInt(behind) || 0
  } else {
    const totalCommits = runGit('rev-list --count HEAD', repoPath)
    aheadCount = parseInt(totalCommits) || 0
  }

  const commits = []
  try {
    const hashes = execSync('git log -5 --format=%h', { cwd: repoPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim().split('\n').filter(Boolean)
    for (const hash of hashes) {
      const subject = runGit(`log -1 --format=%s ${hash}`, repoPath)
      const date = runGit(`log -1 --format=%ar ${hash}`, repoPath)
      const isoDate = runGit(`log -1 --format=%aI ${hash}`, repoPath)
      const author = runGit(`log -1 --format=%an ${hash}`, repoPath)
      commits.push({ hash: hash.trim(), subject, date, isoDate, author })
    }
  } catch {}

  return {
    name,
    path: repoPath,
    branch: branch || '(不明)',
    aheadCount,
    behindCount,
    isOnGitHub,
    remoteUrl: remoteUrl || '',
    commits,
    uncommittedCount: getUncommittedCount(repoPath),
    icon: getAppIcon(repoPath),
    lastSynced: new Date().toISOString(),
  }
}

async function sync() {
  console.log('🔄 同期開始...\n')

  const configPath = join(process.cwd(), 'config.json')
  const config = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, 'utf-8'))
    : { scanPaths: ['C:\\Users\\user\\AndroidStudioProjects'], manualPaths: [] }

  const allPaths = []

  for (const scanPath of config.scanPaths) {
    if (!existsSync(scanPath)) {
      console.log(`⚠ スキャンパスが見つかりません: ${scanPath}`)
      continue
    }
    const dirs = readdirSync(scanPath)
    for (const dir of dirs) {
      const fullPath = join(scanPath, dir)
      if (
        statSync(fullPath).isDirectory() &&
        existsSync(join(fullPath, '.git'))
      ) {
        allPaths.push(fullPath)
      }
    }
  }

  for (const manualPath of config.manualPaths || []) {
    if (existsSync(manualPath) && existsSync(join(manualPath, '.git'))) {
      allPaths.push(manualPath)
    }
  }

  const existingSnap = await get(ref(db, 'apps'))
  const existingData = existingSnap.val() || {}

  const appsData = {}
  for (const repoPath of allPaths) {
    const info = getRepoInfo(repoPath)
    const existing = existingData[info.name] || {}

    const codeStats = scanCodeStats(repoPath)

    appsData[info.name] = {
      ...info,
      codeStats,
      manual: existing.manual || {
        wave: '',
        security: false,
        performance: false,
        testing: false,
        assets: false,
        build: false,
        playstore: false,
        notes: '',
        progressOverride: -1,
      },
    }
    const githubMark = info.isOnGitHub ? '✅ GitHub' : '⚠ GitHubなし'
    console.log(
      `  ✓ ${info.name.padEnd(22)} ${githubMark.padEnd(16)} 画面:${codeStats.screenCount} DB:${codeStats.entityCount} Worker:${codeStats.workerCount}`
    )
  }

  await set(ref(db, 'apps'), appsData)
  await set(ref(db, 'lastSynced'), new Date().toISOString())

  console.log(`\n✅ 同期完了 — ${allPaths.length} 個のアプリを更新しました`)
  process.exit(0)
}

sync().catch((err) => {
  console.error('❌ 同期エラー:', err.message)
  console.error('詳細:', err)
  process.exit(1)
})
