import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCategories, addCategory, updateCategory, deleteCategory } from '../data/storage'

const DEFAULT_COLOR = '#aa3bff'

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLOR)

  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCategories(user.uid).then((loaded) => {
      if (cancelled) return
      setCategories(loaded)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user.uid])

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Category name is required.')
      return
    }
    if (categories.some((c) => c.name === trimmed)) {
      setError('A category with that name already exists.')
      return
    }
    setCategories(await addCategory(user.uid, trimmed, color))
    setName('')
    setColor(DEFAULT_COLOR)
    setError('')
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
    setPendingDelete(null)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(category) {
    const trimmed = editName.trim()
    if (!trimmed) {
      setError('Category name is required.')
      return
    }
    if (trimmed !== category.name && categories.some((c) => c.name === trimmed)) {
      setError('A category with that name already exists.')
      return
    }
    setCategories(
      await updateCategory(user.uid, category.id, category.name, {
        name: trimmed,
        color: editColor,
      }),
    )
    setEditingId(null)
    setError('')
  }

  function confirmDelete(category) {
    setPendingDelete(category)
    setEditingId(null)
  }

  async function handleDelete(category) {
    await deleteCategory(user.uid, category.id, category.name)
    setCategories(await getCategories(user.uid))
    setPendingDelete(null)
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Categories</h1>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Categories</h1>

      <form className="category-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="New category color"
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}

      <ul className="category-list">
        {categories.map((c) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <div className="category-edit-row">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  aria-label={`Color for ${c.name}`}
                />
                <button onClick={() => saveEdit(c)}>Save</button>
                <button className="secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            ) : pendingDelete?.id === c.id ? (
              <div className="category-confirm-row">
                <span>
                  Delete "{c.name}"? Its entries will move to Uncategorized.
                </span>
                <div className="category-confirm-actions">
                  <button className="danger" onClick={() => handleDelete(c)}>
                    Confirm
                  </button>
                  <button className="secondary" onClick={() => setPendingDelete(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="category-info">
                  <span className="color-dot" style={{ background: c.color }} />
                  {c.name}
                </span>
                <div className="category-actions">
                  <button className="secondary" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => confirmDelete(c)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && <li className="empty">No categories yet.</li>}
      </ul>
    </div>
  )
}
