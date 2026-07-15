import { useState } from 'react'
import { getCategories, addCategory, updateCategory, deleteCategory } from '../data/storage'

const DEFAULT_COLOR = '#aa3bff'

export default function Categories() {
  const [categories, setCategoriesState] = useState(getCategories())
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState('')

  const [editingName, setEditingName] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLOR)

  const [pendingDelete, setPendingDelete] = useState(null)

  function handleAdd(e) {
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
    setCategoriesState(addCategory(trimmed, color))
    setName('')
    setColor(DEFAULT_COLOR)
    setError('')
  }

  function startEdit(category) {
    setEditingName(category.name)
    setEditName(category.name)
    setEditColor(category.color)
    setPendingDelete(null)
    setError('')
  }

  function cancelEdit() {
    setEditingName(null)
  }

  function saveEdit(oldName) {
    const trimmed = editName.trim()
    if (!trimmed) {
      setError('Category name is required.')
      return
    }
    if (trimmed !== oldName && categories.some((c) => c.name === trimmed)) {
      setError('A category with that name already exists.')
      return
    }
    setCategoriesState(updateCategory(oldName, { name: trimmed, color: editColor }))
    setEditingName(null)
    setError('')
  }

  function confirmDelete(categoryName) {
    setPendingDelete(categoryName)
    setEditingName(null)
  }

  function handleDelete(categoryName) {
    deleteCategory(categoryName)
    setCategoriesState(getCategories())
    setPendingDelete(null)
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
          <li key={c.name}>
            {editingName === c.name ? (
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
                <button onClick={() => saveEdit(c.name)}>Save</button>
                <button className="secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            ) : pendingDelete === c.name ? (
              <div className="category-confirm-row">
                <span>
                  Delete "{c.name}"? Its entries will move to Uncategorized.
                </span>
                <div className="category-confirm-actions">
                  <button className="danger" onClick={() => handleDelete(c.name)}>
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
                  <button className="danger" onClick={() => confirmDelete(c.name)}>
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
