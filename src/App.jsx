import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import AddEntry from './pages/AddEntry'
import Categories from './pages/Categories'
import Dashboard from './pages/Dashboard'
import Backup from './pages/Backup'
import './App.css'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <NavBar />
      <main className="content">
        <Routes>
          <Route path="/" element={<AddEntry />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
