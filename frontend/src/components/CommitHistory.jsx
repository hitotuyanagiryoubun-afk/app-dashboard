export default function CommitHistory({ commits }) {
  if (!commits || commits.length === 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text3)', padding: '0.5rem 0' }}>
        コミット履歴なし
      </div>
    )
  }
  return (
    <div style={{ marginTop: '0.75rem' }}>
      {commits.map((c, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '0.4rem 0',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          }}
        >
          <code style={{
            fontSize: 11, color: 'var(--primary)',
            background: 'var(--primary-light)',
            padding: '2px 6px', borderRadius: 4,
            flexShrink: 0, lineHeight: 1.6,
          }}>
            {c.hash}
          </code>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              {c.subject}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {c.author} · {c.date}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
