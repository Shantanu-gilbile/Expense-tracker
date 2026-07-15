const CATEGORIES_KEY = 'expense-tracker:categories'
const TRANSACTIONS_KEY = 'expense-tracker:transactions'

export const UNCATEGORIZED = 'Uncategorized'

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#ea580c' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Bills', color: '#ef4444' },
  { name: 'Entertainment', color: '#8b5cf6' },
]

function readJSON(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getCategories() {
  return readJSON(CATEGORIES_KEY, [])
}

export function setCategories(categories) {
  writeJSON(CATEGORIES_KEY, categories)
}

export function seedDefaultCategoriesIfEmpty() {
  const existing = getCategories()
  if (existing.length === 0) {
    setCategories(DEFAULT_CATEGORIES)
  }
}

export function getTransactions() {
  return readJSON(TRANSACTIONS_KEY, [])
}

export function setTransactions(transactions) {
  writeJSON(TRANSACTIONS_KEY, transactions)
}

export function addTransaction(transaction) {
  const transactions = getTransactions()
  const withId = { id: crypto.randomUUID(), ...transaction }
  setTransactions([withId, ...transactions])
  return withId
}

export function deleteTransaction(id) {
  setTransactions(getTransactions().filter((t) => t.id !== id))
}

export function addCategory(name, color) {
  const categories = getCategories()
  if (categories.some((c) => c.name === name)) return categories
  const updated = [...categories, { name, color }]
  setCategories(updated)
  return updated
}

export function updateCategory(oldName, { name, color }) {
  const categories = getCategories().map((c) => (c.name === oldName ? { name, color } : c))
  setCategories(categories)

  if (name !== oldName) {
    const transactions = getTransactions().map((t) =>
      t.category === oldName ? { ...t, category: name } : t,
    )
    setTransactions(transactions)
  }

  return categories
}

export function deleteCategory(name) {
  setCategories(getCategories().filter((c) => c.name !== name))

  const transactions = getTransactions().map((t) =>
    t.category === name ? { ...t, category: UNCATEGORIZED } : t,
  )
  setTransactions(transactions)
}

export function exportData() {
  return {
    categories: getCategories(),
    transactions: getTransactions(),
  }
}

export function importData({ categories, transactions }) {
  setCategories(categories)
  setTransactions(transactions)
}
