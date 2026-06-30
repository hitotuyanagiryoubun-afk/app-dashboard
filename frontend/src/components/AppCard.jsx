import { useState } from 'react'
import { db } from '../firebase.js'
import { ref, update } from 'firebase/database'
import CommitHistory from './CommitHistory.jsx'
import EditModal from './EditModal.jsx'

const CHECKLIST = [
  { key: 'security',    label: 'セキュリティ',      weight: 15 },
  { key: 'performance', label: 'パフォーマンス',    weight: 15 },
  { key: 'testing',     label: 'テスト・修正',      weight: 10 },
  { key: 'assets',      label: 'アイコン・画像',    weight: 10 },
  { key: 'build',       label: 'ビルド・署名',      weight: 25 },
  { key: 'playstore',   label: 'PlayStore申請',    weight: 25 },
]

function calcProgress(manual) {
  if (manual.progressOverride >= 0) return manual.progressOverride
  return CHECKLIST.reduce((sum, c) => sum + (manual[c.key] ? c.weight : 0), 0)
}

function progressColor(pct) {
  if (pct >= 80) return 'var(--success)'
  if (pct >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

export default function AppCard({ app }) {
  const [showCommits, setShowCommits] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const manual = app.manual || {}
  const progress = calcProgress(manual)
  const pColor = progressColor(progress)

  const toggleCheck = async (key) => {
    const newVal = !manual[key]
    await update(ref(db, `apps/${app.name}/manual`), { [key]: newVal })
  }

  const isGitHub = app.isOnGitHub
  const hasUnpushed = app.aheadCount > 0
  const hasUncommitted = app.uncommittedCount > 0

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: '1.25rem',
      boxShadow: 'var(--shadow)',
    }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {app.icon ? (
              <img src={app.icon} alt="" style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
            ) : (
              <span style={{ fontSize: 18, flexShrink: 0 }}>📱</span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{app.name}</h3>

            {/* GitHub状態バッジ */}
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px',
              borderRadius: 20,
              background: isGitHub ? 'var(--success-light)' : 'var(--danger-light)',
              color: isGitHub ? 'var(--success)' : 'var(--danger)',
            }}>
              {isGitHub ? '✓ GitHub' : '⚠ GitHubなし'}
            </span>

            {/* 未pushバッジ */}
            {hasUnpushed && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--warning-light)',
                color: 'var(--warning)',
              }}>
                ↑ {app.aheadCount} 未push
              </span>
            )}

            {/* 未コミットバッジ */}
            {hasUncommitted && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--danger-light)',
                color: 'var(--danger)',
              }}>
                ✎ {app.uncommittedCount} 未コミット
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            ブランチ: <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>{app.branch}</code>
            {manual.wave && (
              <span style={{ marginLeft: 8, color: 'var(--primary)', fontWeight: 500 }}>
                {manual.wave}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          style={{
            fontSize: 12, padding: '0.3rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text2)',
            flexShrink: 0, marginLeft: 8,
          }}
        >
          編集
        </button>
      </div>

      {/* プログレスバー */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: 'var(--text2)', fontWeight: 500 }}>PlayStore 準備度</span>
          <span style={{ fontWeight: 700, color: pColor }}>{progress}%</span>
        </div>
        <div style={{
          height: 8, background: 'var(--border)',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: pColor,
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* チェックリスト */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.4rem',
        marginBottom: '1rem',
      }}>
        {CHECKLIST.map(({ key, label }) => {
          const checked = !!manual[key]
          return (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, cursor: 'pointer',
                color: checked ? 'var(--success)' : 'var(--text2)',
                fontWeight: checked ? 500 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCheck(key)}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--success)' }}
              />
              {label}
            </label>
          )
        })}
      </div>

      {/* 最新コミット */}
      {app.commits && app.commits[0] && (
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.75rem',
          marginBottom: '0.75rem',
          fontSize: 12,
        }}>
          <span style={{ color: 'var(--text3)' }}>最新: </span>
          <code style={{ color: 'var(--primary)', marginRight: 6 }}>{app.commits[0].hash}</code>
          <span style={{ color: 'var(--text2)' }}>{app.commits[0].subject}</span>
          <span style={{ color: 'var(--text3)', marginLeft: 6 }}>{app.commits[0].date}</span>
        </div>
      )}

      {/* メモ */}
      {manual.notes && (
        <div style={{
          fontSize: 12, color: 'var(--text2)',
          background: 'var(--primary-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          borderLeft: '3px solid var(--primary)',
        }}>
          {manual.notes}
        </div>
      )}

      {/* コード分析 */}
      {app.codeStats && (
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.75rem',
          marginBottom: '0.75rem',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: app.codeStats.features?.length ? '0.5rem' : 0 }}>
            {app.codeStats.screenCount > 0 && (
              <span style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{app.codeStats.screenCount}</span> 画面
              </span>
            )}
            {app.codeStats.entityCount > 0 && (
              <span style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{app.codeStats.entityCount}</span> DBテーブル
              </span>
            )}
            {app.codeStats.workerCount > 0 && (
              <span style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{app.codeStats.workerCount}</span> Worker
              </span>
            )}
            {app.codeStats.permissions?.length > 0 && (
              <span style={{ color: 'var(--text2)' }}>
                権限: {app.codeStats.permissions.join(' · ')}
              </span>
            )}
          </div>
          {app.codeStats.features?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {app.codeStats.features.map(f => (
                <span key={f} style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: 11, padding: '1px 6px',
                  borderRadius: 99, fontWeight: 500,
                }}>{f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* コミット履歴トグル */}
      <button
        onClick={() => setShowCommits(!showCommits)}
        style={{
          fontSize: 12, color: 'var(--text3)',
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0.25rem 0',
        }}
      >
        {showCommits ? '▲' : '▼'} コミット履歴 ({app.commits?.length || 0}件)
      </button>

      {showCommits && <CommitHistory commits={app.commits || []} />}
      {showEdit && <EditModal app={app} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
