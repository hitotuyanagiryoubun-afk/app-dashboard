import { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { ref, onValue, update } from 'firebase/database'
import AppCard from './AppCard.jsx'
import AddAppModal from './AddAppModal.jsx'

const WEIGHTS = { security: 15, performance: 15, testing: 10, assets: 10, build: 25, playstore: 25 }
function getProgress(app) {
  const m = app.manual || {}
  if (m.progressOverride >= 0) return m.progressOverride
  return Object.entries(WEIGHTS).reduce((s, [k, w]) => s + (m[k] ? w : 0), 0)
}
function isStale(app) {
  const d = app.commits?.[0]?.isoDate
  return d ? (Date.now() - new Date(d).getTime()) > 7 * 24 * 60 * 60 * 1000 : false
}

export default function Dashboard({ apps, loading, onOpenDocs }) {
  const [showAdd, setShowAdd] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [filterBy, setFilterBy] = useState('all')
  const [autoSync, setAutoSync] = useState({ enabled: false, intervalMinutes: 60 })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const unsub = onValue(ref(db, 'settings/autoSync'), (snap) => {
      if (snap.val()) setAutoSync(snap.val())
    })
    return unsub
  }, [])

  const toggleAutoSync = async () => {
    const next = { ...autoSync, enabled: !autoSync.enabled }
    setAutoSync(next)
    await update(ref(db, 'settings/autoSync'), next)
  }

  const setInterval_ = async (min) => {
    const next = { ...autoSync, intervalMinutes: min }
    setAutoSync(next)
    await update(ref(db, 'settings/autoSync'), next)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
        <div style={{ fontSize: 32, marginBottom: '1rem' }}>⏳</div>
        <p>Firebase からデータを読み込み中...</p>
        <p style={{ fontSize: 12, marginTop: '0.5rem' }}>
          Firebase の設定が未完了の場合は、セットアップガイドを確認してください
        </p>
      </div>
    )
  }

  let appList = Object.values(apps)
  if (filterBy === 'github')   appList = appList.filter(a => a.isOnGitHub)
  if (filterBy === 'nogithub') appList = appList.filter(a => !a.isOnGitHub)
  if (filterBy === 'stale')       appList = appList.filter(isStale)
  if (filterBy === 'uncommitted') appList = appList.filter(a => a.uncommittedCount > 0)
  if (['開発中', 'レビュー申請中', '公開済み', '非公開'].includes(filterBy))
    appList = appList.filter(a => (a.manual?.playStoreStatus || '') === filterBy)

  appList.sort((a, b) => {
    if (sortBy === 'name')     return a.name.localeCompare(b.name)
    if (sortBy === 'progress') return getProgress(b) - getProgress(a)
    if (sortBy === 'commit') {
      const da = a.commits?.[0]?.isoDate || ''
      const db = b.commits?.[0]?.isoDate || ''
      return db.localeCompare(da)
    }
    return 0
  })

  const all = Object.values(apps)
  const githubCount = all.filter(a => a.isOnGitHub).length
  const avgProgress = all.length ? Math.round(all.reduce((s, a) => s + getProgress(a), 0) / all.length) : 0
  const staleCount = all.filter(isStale).length
  const uncommittedTotal = all.reduce((s, a) => s + (a.uncommittedCount || 0), 0)

  const btnStyle = (active) => ({
    fontSize: 12, padding: '0.3rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text2)',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  })

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>アプリ一覧</h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>
            {all.length} 個のアプリを管理中
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: 'var(--primary)', color: '#fff',
            padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
            fontWeight: 500, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + フォルダを追加
        </button>
      </div>

      {/* サマリー */}
      {all.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          marginBottom: '1rem',
        }}>
          {[
            { label: 'GitHub連携', value: `${githubCount} / ${all.length}`, color: 'var(--success)' },
            { label: '平均進捗', value: `${avgProgress}%`, color: avgProgress >= 50 ? 'var(--success)' : avgProgress >= 20 ? 'var(--warning)' : 'var(--danger)' },
            { label: '停滞中', value: `${staleCount} 件`, color: staleCount > 0 ? 'var(--warning)' : 'var(--text3)' },
            { label: '未コミット合計', value: `${uncommittedTotal} ファイル`, color: uncommittedTotal > 0 ? 'var(--danger)' : 'var(--text3)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem',
              fontSize: 12,
            }}>
              <span style={{ color: 'var(--text3)' }}>{label}: </span>
              <span style={{ fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* フィルタ・ソート */}
      {all.length > 0 && (
        <div className="filter-bar">
          <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 2 }}>絞り込み:</span>
          {[
            { key: 'all',           label: 'すべて' },
            { key: 'github',        label: '✓ GitHub' },
            { key: 'nogithub',      label: '⚠ GitHubなし' },
            { key: 'uncommitted',   label: '✎ 未コミット' },
            { key: 'stale',         label: '⏸ 停滞中' },
            { key: '開発中',         label: '🔨 開発中' },
            { key: 'レビュー申請中', label: '📋 申請中' },
            { key: '公開済み',       label: '✅ 公開済み' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterBy(key)} style={btnStyle(filterBy === key)}>
              {label}
            </button>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8, marginRight: 2 }}>ソート:</span>
          {[
            { key: 'name',     label: '名前順' },
            { key: 'progress', label: '進捗順' },
            { key: 'commit',   label: '最終コミット順' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} style={btnStyle(sortBy === key)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {appList.length === 0 ? (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '2px dashed var(--border)', padding: '3rem',
          textAlign: 'center', color: 'var(--text3)',
        }}>
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>📱</div>
          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
            {all.length === 0 ? 'アプリがまだ登録されていません' : '条件に一致するアプリがありません'}
          </p>
          {all.length === 0 && (
            <p style={{ fontSize: 13 }}>
              sync-agent を実行するか、「フォルダを追加」からアプリを追加してください
            </p>
          )}
        </div>
      ) : (
        <div className="app-grid">
          {appList.map((app) => (
            <AppCard key={app.name} app={app} onOpenDocs={onOpenDocs} />
          ))}
        </div>
      )}

      {/* 自動実行設定 */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <button
          onClick={() => setShowSettings(s => !s)}
          style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ⚙ 自動実行設定 {showSettings ? '▲' : '▼'}
        </button>

        {showSettings && (
          <div style={{
            marginTop: '0.75rem', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>sync-agent 自動実行</span>
              <button
                onClick={toggleAutoSync}
                style={{
                  fontSize: 13, padding: '0.3rem 1rem',
                  borderRadius: 99,
                  background: autoSync.enabled ? 'var(--success)' : 'var(--surface2)',
                  color: autoSync.enabled ? '#fff' : 'var(--text2)',
                  border: `1px solid ${autoSync.enabled ? 'var(--success)' : 'var(--border)'}`,
                  fontWeight: 600,
                }}
              >
                {autoSync.enabled ? '✅ ON' : '⛔ OFF'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>実行間隔:</span>
              {[30, 60, 120].map(min => (
                <button
                  key={min}
                  onClick={() => setInterval_(min)}
                  style={{
                    fontSize: 12, padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: autoSync.intervalMinutes === min ? 'var(--primary)' : 'var(--surface2)',
                    color: autoSync.intervalMinutes === min ? '#fff' : 'var(--text2)',
                  }}
                >
                  {min}分
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
              <strong>初回起動（一度だけ実行）:</strong><br />
              <code style={{ color: 'var(--primary)', userSelect: 'all' }}>
                cd C:\Users\user\Projects\app-dashboard\sync-agent &amp;&amp; node sync.js --daemon
              </code>
              <br />
              <span style={{ color: 'var(--text3)' }}>デーモンが起動したあとは、上のトグルでON/OFFを切り替えられます。</span>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddAppModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
