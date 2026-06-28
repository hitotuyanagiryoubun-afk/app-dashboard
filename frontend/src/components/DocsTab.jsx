import { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

function DocViewer({ doc, onEdit, onDelete, onClose }) {
  const html = marked(doc.content || '')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 800, margin: '2rem auto', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1, borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, flex: 1, marginRight: 12 }}>{doc.title}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)' }}>編集</button>
            <button onClick={onDelete} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)' }}>削除</button>
            <button onClick={onClose} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)' }}>閉じる</button>
          </div>
        </div>
        <div
          style={{ padding: '1.5rem', fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
          .doc-body h1,.doc-body h2,.doc-body h3{font-weight:700;margin:1.5rem 0 0.5rem}
          .doc-body h1{font-size:20px}.doc-body h2{font-size:17px}.doc-body h3{font-size:15px}
          .doc-body p{margin:0.5rem 0}
          .doc-body ul,.doc-body ol{padding-left:1.5rem;margin:0.5rem 0}
          .doc-body li{margin:0.25rem 0}
          .doc-body code{background:var(--surface2);padding:2px 5px;border-radius:4px;font-size:13px;font-family:monospace}
          .doc-body pre{background:var(--surface2);padding:1rem;border-radius:var(--radius-sm);overflow-x:auto;margin:0.75rem 0}
          .doc-body pre code{background:none;padding:0}
          .doc-body strong{font-weight:700}
          .doc-body hr{border:none;border-top:1px solid var(--border);margin:1.5rem 0}
          .doc-body blockquote{border-left:3px solid var(--primary);padding-left:1rem;color:var(--text2);margin:0.75rem 0}
        `}</style>
      </div>
    </div>
  )
}

function DocEditor({ doc, onSave, onCancel }) {
  const [title, setTitle] = useState(doc?.title || '')
  const [content, setContent] = useState(doc?.content || '')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), content, updatedAt: new Date().toISOString() })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 900, margin: '2rem auto', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{doc ? '指示書を編集' : '新しい指示書を追加'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreview(!preview)} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: preview ? 'var(--primary)' : 'var(--text2)', background: preview ? 'var(--primary-light)' : 'transparent' }}>
              {preview ? '編集に戻る' : 'プレビュー'}
            </button>
            <button onClick={onCancel} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)' }}>キャンセル</button>
            <button onClick={save} disabled={saving || !title.trim()} style={{ fontSize: 13, padding: '0.3rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-sm)', opacity: saving ? 0.7 : 1 }}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}
          />
          {preview ? (
            <div
              style={{ minHeight: 400, padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="マークダウンで記入できます（# 見出し、**太字**、- リストなど）"
              style={{ width: '100%', minHeight: 500, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.7, fontFamily: 'monospace', resize: 'vertical' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function DocsTab() {
  const [docs, setDocs] = useState({})
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const unsub = onValue(ref(db, 'docs'), (snap) => {
      setDocs(snap.val() || {})
    })
    return unsub
  }, [])

  const saveDoc = async (data) => {
    if (isNew) {
      await push(ref(db, 'docs'), { ...data, createdAt: new Date().toISOString() })
    } else {
      await update(ref(db, `docs/${editing.id}`), data)
    }
    setEditing(null)
    setIsNew(false)
  }

  const deleteDoc = async (id) => {
    await remove(ref(db, `docs/${id}`))
    setViewing(null)
    setConfirmDelete(null)
  }

  const docList = Object.entries(docs).map(([id, d]) => ({ id, ...d })).sort((a, b) => (a.createdAt || '') < (b.createdAt || '') ? -1 : 1)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>指示書・プロンプト</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{docList.length} 件 — クリックして読む・編集・追加できます</p>
        </div>
        <button
          onClick={() => { setIsNew(true); setEditing({ title: '', content: '' }) }}
          style={{ background: 'var(--primary)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 14 }}
        >
          + 新しい指示書を追加
        </button>
      </div>

      {docList.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>📄</div>
          <p>指示書がまだありません。「+ 新しい指示書を追加」から追加してください。</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {docList.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setViewing(doc)}
              style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '1.25rem', cursor: 'pointer', boxShadow: 'var(--shadow)', transition: 'box-shadow 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            >
              <div style={{ fontSize: 28, marginBottom: '0.5rem' }}>📄</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>{doc.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {doc.content?.replace(/[#*`>\-]/g, '').slice(0, 120)}...
              </p>
              {doc.updatedAt && (
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: '0.75rem' }}>
                  更新: {new Date(doc.updatedAt).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {viewing && !editing && (
        <DocViewer
          doc={viewing}
          onEdit={() => { setEditing(viewing); setIsNew(false) }}
          onDelete={() => setConfirmDelete(viewing.id)}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <DocEditor
          doc={isNew ? null : editing}
          onSave={saveDoc}
          onCancel={() => { setEditing(null); setIsNew(false) }}
        />
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '1.5rem', maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>🗑️</div>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>この指示書を削除しますか？</p>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1.5rem' }}>削除すると元に戻せません。</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 14 }}>キャンセル</button>
              <button onClick={() => deleteDoc(confirmDelete)} style={{ padding: '0.5rem 1.25rem', background: 'var(--danger)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
