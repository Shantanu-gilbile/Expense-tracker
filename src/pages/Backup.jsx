import { useRef, useState } from 'react'
import { exportData, importData } from '../data/storage'

function isValidBackup(data) {
  if (!data || typeof data !== 'object') return false
  if (!Array.isArray(data.categories) || !Array.isArray(data.transactions)) return false
  const categoriesValid = data.categories.every(
    (c) => c && typeof c.name === 'string' && typeof c.color === 'string',
  )
  const transactionsValid = data.transactions.every(
    (t) =>
      t &&
      typeof t.id === 'string' &&
      typeof t.amount === 'number' &&
      typeof t.category === 'string' &&
      typeof t.date === 'string',
  )
  return categoriesValid && transactionsValid
}

export default function Backup() {
  const fileInputRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [pendingFileName, setPendingFileName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importing, setImporting] = useState(false)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `expense-tracker-backup-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSuccess('Backup downloaded.')
    setError('')
  }

  function handleImportClick() {
    setError('')
    setSuccess('')
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setSuccess('')
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!isValidBackup(parsed)) {
        setError('That file doesn\'t look like a valid backup (expected categories and transactions arrays).')
        setPendingImport(null)
      } else {
        setPendingImport(parsed)
        setPendingFileName(file.name)
        setError('')
      }
    } catch {
      setError('Could not read that file. Make sure it\'s a valid JSON export.')
      setPendingImport(null)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function confirmImport() {
    importData(pendingImport)
    setPendingImport(null)
    setPendingFileName('')
    setSuccess('Data restored from backup.')
  }

  function cancelImport() {
    setPendingImport(null)
    setPendingFileName('')
  }

  return (
    <div className="page">
      <h1>Backup</h1>
      <p className="backup-note">
        All your data lives only in this browser's storage. Export a backup regularly so
        clearing your browser data doesn't lose it.
      </p>

      <div className="backup-section">
        <h2>Export Data</h2>
        <p>Download all categories and transactions as a single JSON file.</p>
        <button onClick={handleExport}>Export Data</button>
      </div>

      <div className="backup-section">
        <h2>Import Data</h2>
        <p>Restore from a previously exported JSON file. This overwrites all current data.</p>
        <button onClick={handleImportClick} disabled={importing} aria-busy={importing}>
          {importing ? 'Reading file…' : 'Import Data'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="visually-hidden"
        />

        {pendingImport && (
          <div className="category-confirm-row">
            <span>
              Import "{pendingFileName}"? This will overwrite all {pendingImport.categories.length}{' '}
              categories and {pendingImport.transactions.length} transactions currently stored.
            </span>
            <div className="category-confirm-actions">
              <button className="danger" onClick={confirmImport}>
                Overwrite and Import
              </button>
              <button className="secondary" onClick={cancelImport}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="confirmation">{success}</p>}
    </div>
  )
}
