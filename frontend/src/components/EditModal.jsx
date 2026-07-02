import { useState } from 'react'
import { db } from '../firebase.js'
import { ref, update } from 'firebase/database'

const CHECKLIST = [
  { key: 'security',    label: 'セキュリティ' },
  { key: 'performance', label: 'パフォーマンス' },
  { key: 'testing',     label: 'テスト・修正' },
  { key: 'assets',      label: 'アイコン・画像' },
  { key: 'build',       label: 'ビルド・署名' },
  { key: 'playstore',   label: 'PlayStore申請' },
]

export default function EditModal({ app, onClose }) {
  const m = app.manual || {}
  const [wave, setWave] = useState(m.wave || '')
  const [checks, setChecks] = useState({
    security: !!m.security,
    performance: !!m.performance,
    testing: !!m.testing,
    assets: !!m.assets,
    build: !!m.build,
    playstore: !!m.playstore,
  })
  const [notes, setNotes] = useState(m.notes || '')
  const [playStoreUrl, setPlayStoreUrl] = useState(m.playStoreUrl || '')
  const [progressOverride, setProgressOverride] = useState(
    m.progressOverride >= 0 ? m.progressOverride : ''
  )
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await update(ref(db, `apps/${app.name}/manual`), {
      wave,
      ...checks,
      notes,
      progressOverride: progressOverride !== '' ? Number(progressOverride) : -1,
      playStoreUrl,
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
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1.25rem' }}>
          {app.name} を編集
        </h2>

        {/* Wave */}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
            磨き上げ Wave（例: Wave 3 実装中）
          </div>
          <input
            value={wave}
            onChange={(e) => setWave(e.target.value)}
            placeholder="Wave 1 完了 / Wave 2 実装中..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            }}
          />
        </label>

        {/* チェックリスト */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
            完了した項目
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {CHECKLIST.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checks[key]}
                  onChange={() => setChecks((p) => ({ ...p, [key]: !p[key] }))}
                  style={{ width: 15, height: 15, accentColor: 'var(--success)' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* 準備度 手動上書き */}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
            準備度 手動設定 %（空白 = チェックリストから自動計算）
          </div>
          <input
            type="number"
            min={0} max={100}
            value={progressOverride}
            onChange={(e) => setProgressOverride(e.target.value)}
            placeholder="例: 75"
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            }}
          />
        </label>

        {/* PlayStore URL */}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
            Google Play Console URL（任意）
          </div>
          <input
            value={playStoreUrl}
            onChange={(e) => setPlayStoreUrl(e.target.value)}
            placeholder="https://play.google.com/store/apps/details?id=..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 12,
            }}
          />
        </label>

        {/* メモ */}
        <label style={{ display: 'block', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
            メモ・次のタスク
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="次のやること、気になる点など..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              resize: 'vertical',
            }}
          />
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
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
