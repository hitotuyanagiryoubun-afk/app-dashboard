import { useState } from 'react'
import { db } from '../firebase.js'
import { ref, update } from 'firebase/database'

export default function AddAppModal({ onClose }) {
  const [path, setPath] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!path.trim()) { setError('フォルダパスを入力してください'); return }
    setSaving(true)
    const name = path.trim().replace(/\\/g, '/').split('/').filter(Boolean).pop()
    if (!name) { setError('有効なパスではありません'); setSaving(false); return }
    await update(ref(db, `apps/${name}`), {
      name,
      path: path.trim(),
      branch: '(未同期)',
      aheadCount: 0,
      behindCount: 0,
      isOnGitHub: false,
      remoteUrl: '',
      commits: [],
      lastSynced: new Date().toISOString(),
      manual: {
        wave: '',
        security: false,
        performance: false,
        testing: false,
        build: false,
        playstore: false,
        notes: '',
        progressOverride: -1,
      },
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          width: '100%', maxWidth: 480,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1rem' }}>
          アプリを手動追加
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
          別のフォルダにあるアプリを追加できます。<br />
          次回 sync-agent を実行すると git 情報が自動取得されます。
        </p>
        <label style={{ display: 'block', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
            フォルダパス
          </div>
          <input
            value={path}
            onChange={(e) => { setPath(e.target.value); setError('') }}
            placeholder="例: C:\Users\user\Projects\MyApp"
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
            }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text2)', fontSize: 14,
            }}
          >
            キャンセル
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 500,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>
    </div>
  )
}
