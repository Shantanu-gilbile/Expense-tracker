import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getTransactions, addTransaction, deleteTransaction } from '../data/storage'
import { formatCurrency } from '../utils/currency'

const today = () => new Date().toISOString().slice(0, 10)

export default function AddEntry() {
  const categories = getCategories()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0]?.name ?? '')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [transactions, setTransactions] = useState(getTransactions())

  const todaysEntries = transactions.filter((t) => t.date === today())

  function colorFor(categoryName) {
    return categories.find((c) => c.name === categoryName)?.color ?? '#9ca3af'
  }

  function handleSubmit(e) {
    e.preventDefault()
    setConfirmation('')

    const parsedAmount = parseFloat(amount)
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.')
      return
    }
    if (!category) {
      setError('Select a category.')
      return
    }
    if (!date) {
      setError('Select a date.')
      return
    }

    addTransaction({ amount: parsedAmount, category, date, description: description.trim() })
    setTransactions(getTransactions())
    setAmount('')
    setDescription('')
    setDate(today())
    setError('')
    setConfirmation('Entry added.')
    setTimeout(() => setConfirmation(''), 2000)
  }

  function handleDelete(id) {
    deleteTransaction(id)
    setTransactions(getTransactions())
  }

  if (categories.length === 0) {
    return (
      <div className="page">
        <h1>Add Entry</h1>
        <p>
          No categories yet. Add one on the <Link to="/categories">Categories</Link> page first.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Add Entry</h1>
      <form className="entry-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <div className="currency-input">
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <button type="submit">Add Entry</button>
        {error && <p className="error">{error}</p>}
        {confirmation && <p className="confirmation">{confirmation}</p>}
      </form>

      <h2>Today's Entries</h2>
      {todaysEntries.length === 0 ? (
        <p>No entries yet today.</p>
      ) : (
        <ul className="entry-list">
          {todaysEntries.map((t) => (
            <li key={t.id}>
              <div className="entry-info">
                <span className="entry-category">
                  <span className="color-dot" style={{ background: colorFor(t.category) }} />
                  {t.category}
                </span>
                {t.description && <span className="entry-description">{t.description}</span>}
              </div>
              <div className="entry-actions">
                <span className="entry-amount">{formatCurrency(t.amount)}</span>
                <button onClick={() => handleDelete(t.id)} aria-label="Delete entry">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
