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
      const author = runGit(`log -1 --format=%an ${hash}`, repoPath)
      commits.push({ hash: hash.trim(), subject, date, author })
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

    appsData[info.name] = {
      ...info,
      manual: existing.manual || {
        wave: '',
        security: false,
        performance: false,
        testing: false,
        build: false,
        playstore: false,
        notes: '',
        progressOverride: -1,
      },
    }
    const githubMark = info.isOnGitHub ? '✅ GitHub' : '⚠ GitHubなし'
    console.log(
      `  ✓ ${info.name.padEnd(22)} ${githubMark.padEnd(16)} branch: ${info.branch} | ahead: ${info.aheadCount}`
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
