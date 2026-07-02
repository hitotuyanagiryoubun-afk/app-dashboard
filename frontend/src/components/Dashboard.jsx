import { useState } from 'react'
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

export default function Dashboard({ apps, loading }) {
  const [showAdd, setShowAdd] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [filterBy, setFilterBy] = useState('all')

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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))',
          gap: '1rem',
        }}>
          {appList.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </div>
      )}

      {showAdd && <AddAppModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
