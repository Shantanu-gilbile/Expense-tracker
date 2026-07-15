import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getCategories, getTransactions, deleteTransaction } from '../data/storage'
import { formatCurrency, formatCurrencyCompact } from '../utils/currency'

const PAGE_SIZE = 20
const FALLBACK_COLOR = '#9ca3af'

function useCssVar(name, fallback) {
  const [value, setValue] = useState(fallback)

  useEffect(() => {
    function update() {
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      if (resolved) setValue(resolved)
    }
    update()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [name])

  return value
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedCategories, setSelectedCategories] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const [page, setPage] = useState(1)

  const accent = useCssVar('--accent', '#aa3bff')
  const textColor = useCssVar('--text', '#6b6375')
  const borderColor = useCssVar('--border', '#e5e4e7')
  const bgColor = useCssVar('--bg', '#fff')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getCategories(user.uid), getTransactions(user.uid)]).then(
      ([loadedCategories, loadedTransactions]) => {
        if (cancelled) return
        setCategories(loadedCategories)
        setTransactions(loadedTransactions)
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [user.uid])

  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name)
    transactions.forEach((t) => {
      if (!names.includes(t.category)) names.push(t.category)
    })
    return names
  }, [categories, transactions])

  function colorFor(categoryName) {
    return categories.find((c) => c.name === categoryName)?.color ?? FALLBACK_COLOR
  }

  async function handleDelete(id) {
    await deleteTransaction(user.uid, id)
    setTransactions(await getTransactions(user.uid))
  }

  function toggleCategory(name) {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    )
  }

  function clearFilters() {
    setSelectedCategories([])
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (searchLower && !t.description?.toLowerCase().includes(searchLower)) return false
      return true
    })
  }, [transactions, selectedCategories, dateFrom, dateTo, search])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'amount') {
        return (av - bv) * dir
      }
      av = (av ?? '').toString().toLowerCase()
      bv = (bv ?? '').toString().toLowerCase()
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [filtered, sortKey, sortDir])

  useEffect(() => {
    setPage(1)
  }, [selectedCategories, dateFrom, dateTo, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const total = filtered.reduce((sum, t) => sum + t.amount, 0)
  const count = filtered.length
  const average = count > 0 ? total / count : 0

  const byCategory = filtered.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

  const dailySpend = useMemo(() => {
    const byDate = {}
    filtered.forEach((t) => {
      byDate[t.date] = (byDate[t.date] ?? 0) + t.amount
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, amount]) => ({ date, amount }))
  }, [filtered])

  const monthlyTotals = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: monthKey(d), label: monthLabel(d), amount: 0 })
    }
    const byKey = Object.fromEntries(months.map((m) => [m.key, m]))
    filtered.forEach((t) => {
      const key = t.date.slice(0, 7)
      if (byKey[key]) byKey[key].amount += t.amount
    })
    return months
  }, [filtered])

  const categoryPie = useMemo(
    () => Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    [byCategory],
  )

  const hasAnyTransactions = transactions.length > 0
  const emptyMessage = hasAnyTransactions
    ? 'No transactions match these filters.'
    : 'No transactions yet. Add one from the Add Entry page.'

  function sortIndicator(key) {
    if (sortKey !== key) return null
    return <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  const tooltipStyle = {
    background: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: 6,
    color: textColor,
    fontSize: 13,
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="category-checkboxes">
            {categoryOptions.map((name) => (
              <label key={name} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(name)}
                  onChange={() => toggleCategory(name)}
                />
                <span className="color-dot" style={{ background: colorFor(name) }} />
                {name}
              </label>
            ))}
            {categoryOptions.length === 0 && <span className="empty">No categories yet.</span>}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Date range</span>
          <div className="date-range">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Description</span>
          <input
            type="text"
            placeholder="Search description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="summary-cards">
        <div className="card">
          <span className="label">Total Spent</span>
          <span className="value">{formatCurrency(total)}</span>
        </div>
        <div className="card">
          <span className="label">Transactions</span>
          <span className="value">{count}</span>
        </div>
        <div className="card">
          <span className="label">Average Amount</span>
          <span className="value">{formatCurrency(average)}</span>
        </div>
      </div>

      <h2>Charts</h2>
      {filtered.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Daily Spend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailySpend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke={borderColor} strokeDasharray="none" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: borderColor }}
                  interval="preserveStartEnd"
                  angle={-35}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={formatCurrencyCompact}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value), 'Spend']}
                />
                <Bar dataKey="amount" fill={accent} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Monthly Totals (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTotals} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke={borderColor} strokeDasharray="none" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: borderColor }}
                />
                <YAxis
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={formatCurrencyCompact}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value), 'Total']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={accent}
                  strokeWidth={2}
                  dot={{ r: 4, fill: accent, stroke: bgColor, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: accent, stroke: bgColor, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card chart-card-wide">
            <h3>Spend by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: borderColor }}
                >
                  {categoryPie.map((entry) => (
                    <Cell key={entry.name} fill={colorFor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value), 'Spend']}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13, color: textColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <h2>By Category</h2>
      {Object.keys(byCategory).length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <ul className="category-breakdown">
          {Object.entries(byCategory).map(([category, amount]) => (
            <li key={category}>
              <span>
                <span className="color-dot" style={{ background: colorFor(category) }} />
                {category}
              </span>
              <span>{formatCurrency(amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>Transactions</h2>
      {sorted.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <>
          <div className="table-scroll">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('date')}>
                    Date {sortIndicator('date')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('category')}>
                    Category {sortIndicator('category')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('description')}>
                    Description {sortIndicator('description')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('amount')}>
                    Amount {sortIndicator('amount')}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className="color-dot" style={{ background: colorFor(t.category) }} />
                      {t.category}
                    </td>
                    <td>{t.description}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>
                      <button onClick={() => handleDelete(t.id)} aria-label="Delete transaction">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
