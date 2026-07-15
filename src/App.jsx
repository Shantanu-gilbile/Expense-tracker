import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import AddEntry from './pages/AddEntry'
import Categories from './pages/Categories'
import Dashboard from './pages/Dashboard'
import Backup from './pages/Backup'
import { AuthProvider, useAuth } from './context/AuthContext'
import { seedDefaultCategoriesIfEmpty } from './data/storage'
import './App.css'

function AppShell() {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setReady(false)
      return
    }
    let cancelled = false
    setReady(false)
    seedDefaultCategoriesIfEmpty(user.uid).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) {
    return <div className="app-loading">Loading…</div>
  }

  if (!user) {
    return <Login />
  }

  if (!ready) {
    return <div className="app-loading">Setting up your account…</div>
  }

  return (
    <>
      <NavBar />
      <main className="content">
        <Routes>
          <Route path="/" element={<AddEntry />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
