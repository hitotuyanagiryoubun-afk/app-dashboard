import { useState, useEffect } from 'react'
import { db, isFirebaseConfigured } from './firebase.js'
import { ref, onValue } from 'firebase/database'
import Dashboard from './components/Dashboard.jsx'
import GuideTab from './components/GuideTab.jsx'
import DocsTab from './components/DocsTab.jsx'

const PASSWORD = '7926'

function LoginScreen({ onLogin }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const submit = () => {
    if (input === PASSWORD) {
      localStorage.setItem('dashboard_auth', '1')
      onLogin()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 360, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: '1rem' }}>📱</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.5rem' }}>App Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1.5rem' }}>パスワードを入力してください</p>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="パスワード"
          autoFocus
          style={{ width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', fontSize: 16, marginBottom: '0.5rem', textAlign: 'center', letterSpacing: 4 }}
        />
        {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: '0.5rem' }}>パスワードが違います</p>}
        <button
          onClick={submit}
          style={{ width: '100%', padding: '0.6rem', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 500, marginTop: '0.5rem' }}
        >
          ログイン
        </button>
      </div>
    </div>
  )
}

function SetupScreen() {
  return (
    <div style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: '2rem',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontSize: 40, marginBottom: '1rem', textAlign: 'center' }}>🔧</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>
          Firebase の設定が必要です
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          このダッシュボードを使うには、Firebase の設定ファイルを作成する必要があります。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { num: 1, text: 'console.firebase.google.com を開く', sub: 'Google アカウントでログイン' },
            { num: 2, text: '「プロジェクトを追加」→ 名前: app-dashboard', sub: 'Realtime Database も有効化する' },
            { num: 3, text: 'ウェブアプリを追加 → 設定値をコピー', sub: 'apiKey, databaseURL などが必要' },
            { num: 4, text: 'frontend フォルダに .env ファイルを作成', sub: 'C:\\Users\\user\\Projects\\app-dashboard\\frontend\\.env' },
            { num: 5, text: 'sync-agent フォルダにも .env ファイルを作成', sub: 'C:\\Users\\user\\Projects\\app-dashboard\\sync-agent\\.env' },
            { num: 6, text: 'sync-agent を実行してアプリ情報を登録', sub: 'cd sync-agent && npm install && node sync.js' },
          ].map(({ num, text, sub }) => (
            <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>{num}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{text}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '1.5rem', padding: '1rem',
          background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--text2)', lineHeight: 1.8,
        }}>
          <strong>.env ファイルの内容（例）：</strong><br />
          <code style={{ color: 'var(--primary)' }}>
            VITE_FIREBASE_API_KEY=AIzaSy...<br />
            VITE_FIREBASE_DATABASE_URL=https://app-dashboard-xxx-rtdb.firebaseio.com<br />
            VITE_FIREBASE_PROJECT_ID=app-dashboard-xxx<br />
            VITE_FIREBASE_APP_ID=1:123:web:abc
          </code>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(localStorage.getItem('dashboard_auth') === '1')
  const [tab, setTab] = useState('dashboard')
  const [apps, setApps] = useState({})
  const [lastSynced, setLastSynced] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dashboard_dark')
    if (stored !== null) return stored === '1'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('dashboard_dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    if (!authed || !isFirebaseConfigured) return
    const unsubApps = onValue(ref(db, 'apps'), (snap) => {
      setApps(snap.val() || {})
      setLoading(false)
    })
    const unsubSync = onValue(ref(db, 'lastSynced'), (snap) => {
      setLastSynced(snap.val())
    })
    return () => { unsubApps(); unsubSync() }
  }, [authed])

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  if (!isFirebaseConfigured) return <SetupScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2rem', height: 56 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
            App Dashboard
          </h1>
          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {[
              { key: 'dashboard', label: 'アプリ一覧' },
              { key: 'docs', label: '指示書・プロンプト' },
              { key: 'guide', label: 'PlayStore 出品ガイド' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: tab === key ? 700 : 400,
                  color: tab === key ? 'var(--primary)' : 'var(--text2)',
                  background: tab === key ? 'var(--primary-light)' : 'transparent',
                  fontSize: 14,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          {lastSynced && (
            <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
              最終同期: {new Date(lastSynced).toLocaleString('ja-JP')}
            </span>
          )}
          <button
            onClick={() => setDark(d => !d)}
            title={dark ? 'ライトモードへ' : 'ダークモードへ'}
            style={{
              fontSize: 18, padding: '0.25rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
              lineHeight: 1,
            }}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {tab === 'dashboard' && <Dashboard apps={apps} loading={loading} />}
        {tab === 'docs' && <DocsTab />}
        {tab === 'guide' && <GuideTab />}
      </main>
    </div>
  )
}
