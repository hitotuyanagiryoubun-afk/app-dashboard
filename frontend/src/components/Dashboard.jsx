import { useState } from 'react'
import AppCard from './AppCard.jsx'
import AddAppModal from './AddAppModal.jsx'

export default function Dashboard({ apps, loading }) {
  const [showAdd, setShowAdd] = useState(false)
  const appList = Object.values(apps).sort((a, b) => a.name.localeCompare(b.name))

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>アプリ一覧</h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>
            {appList.length} 個のアプリを管理中
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 500,
            fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + フォルダを追加
        </button>
      </div>

      {appList.length === 0 ? (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '2px dashed var(--border)', padding: '3rem',
          textAlign: 'center', color: 'var(--text3)',
        }}>
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>📱</div>
          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>アプリがまだ登録されていません</p>
          <p style={{ fontSize: 13 }}>
            sync-agent を実行するか、「フォルダを追加」からアプリを追加してください
          </p>
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
