import { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

function TagBadge({ tag, onClick, active }) {
  return (
    <span
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(tag) } : undefined}
      style={{
        fontSize: 11, padding: '1px 8px', borderRadius: 99,
        background: active ? 'var(--primary)' : 'var(--primary-light)',
        color: active ? '#fff' : 'var(--primary)',
        cursor: onClick ? 'pointer' : 'default',
        fontWeight: 500,
      }}
    >{tag}</span>
  )
}

function DocViewer({ doc, apps, onEdit, onDelete, onClose }) {
  const html = marked(doc.content || '')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 800, margin: '2rem auto', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1, borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{doc.title}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {doc.appName && (
                <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 99, background: 'var(--surface2)', color: 'var(--text2)', fontWeight: 500 }}>
                  📱 {doc.appName}
                </span>
              )}
              {doc.tags?.map(t => <TagBadge key={t} tag={t} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)' }}>編集</button>
            <button onClick={onDelete} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)' }}>削除</button>
            <button onClick={onClose} style={{ fontSize: 13, padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)' }}>閉じる</button>
          </div>
        </div>
        <div
          className="doc-body"
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

function DocEditor({ doc, apps, onSave, onCancel }) {
  const [title, setTitle] = useState(doc?.title || '')
  const [content, setContent] = useState(doc?.content || '')
  const [appName, setAppName] = useState(doc?.appName || '')
  const [tagsInput, setTagsInput] = useState(doc?.tags?.join(', ') || '')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    await onSave({ title: title.trim(), content, appName, tags, updatedAt: new Date().toISOString() })
    setSaving(false)
  }

  const appList = Object.keys(apps)

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
            <button onClick={save} disabled={saving || !title.trim()} style={{ fontSize: 13, padding: '0.3rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-sm)', opacity: (saving || !title.trim()) ? 0.7 : 1 }}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 600, marginBottom: '0.75rem', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <select
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
            >
              <option value="">📁 全般（アプリに紐付けない）</option>
              {appList.map(name => (
                <option key={name} value={name}>📱 {name}</option>
              ))}
            </select>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="タグ（カンマ区切り: UI, 設計, バグ）"
              style={{ flex: 2, padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
            />
          </div>
          {preview ? (
            <div
              className="doc-body"
              style={{ minHeight: 400, padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="マークダウンで記入できます（# 見出し、**太字**、- リストなど）"
              style={{ width: '100%', minHeight: 500, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.7, fontFamily: 'monospace', resize: 'vertical', background: 'var(--surface)', color: 'var(--text)' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function DocsTab({ apps = {}, filterApp = '', onFilterChange = () => {} }) {
  const [docs, setDocs] = useState({})
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')

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

  let docList = Object.entries(docs)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => (a.createdAt || '') < (b.createdAt || '') ? -1 : 1)

  if (filterApp) docList = docList.filter(d => d.appName === filterApp)
  if (activeTag)  docList = docList.filter(d => d.tags?.includes(activeTag))
  if (search) {
    const q = search.toLowerCase()
    docList = docList.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.content?.toLowerCase().includes(q) ||
      d.tags?.some(t => t.toLowerCase().includes(q))
    )
  }

  const allTags = [...new Set(Object.values(docs).flatMap(d => d.tags || []))]
  const totalCount = Object.keys(docs).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>指示書・プロンプト</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {totalCount} 件 — クリックして読む・編集・追加できます
          </p>
        </div>
        <button
          onClick={() => { setIsNew(true); setEditing({ title: '', content: '', appName: '', tags: [] }) }}
          style={{ background: 'var(--primary)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 14 }}
        >
          + 新しい指示書を追加
        </button>
      </div>

      {/* 検索・フィルター */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 タイトル・内容・タグで検索..."
          style={{
            padding: '0.4rem 0.75rem', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: 13, flex: 1, minWidth: 200,
            background: 'var(--surface)', color: 'var(--text)',
          }}
        />
        {filterApp && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 500 }}>
            📱 {filterApp}
            <button onClick={() => onFilterChange('')} style={{ fontSize: 15, color: 'var(--primary)', lineHeight: 1, padding: '0 2px' }}>×</button>
          </span>
        )}
        {allTags.map(tag => (
          <TagBadge key={tag} tag={tag} active={activeTag === tag} onClick={(t) => setActiveTag(activeTag === t ? '' : t)} />
        ))}
      </div>

      {docList.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>📄</div>
          <p>{totalCount === 0 ? '指示書がまだありません。「+ 新しい指示書を追加」から追加してください。' : '条件に一致する指示書がありません。'}</p>
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
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text)' }}>{doc.title}</h3>
              {doc.appName && (
                <span style={{ display: 'inline-block', fontSize: 11, padding: '1px 8px', borderRadius: 99, background: 'var(--surface2)', color: 'var(--text2)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  📱 {doc.appName}
                </span>
              )}
              <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {doc.content?.replace(/[#*`>\-]/g, '').slice(0, 120)}...
              </p>
              {doc.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {doc.tags.map(t => <TagBadge key={t} tag={t} />)}
                </div>
              )}
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
          apps={apps}
          onEdit={() => { setEditing(viewing); setIsNew(false) }}
          onDelete={() => setConfirmDelete(viewing.id)}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <DocEditor
          doc={isNew ? null : editing}
          apps={apps}
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
