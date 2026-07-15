import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        Add Entry
      </NavLink>
      <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
        Categories
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
        Dashboard
      </NavLink>
      <NavLink to="/backup" className={({ isActive }) => (isActive ? 'active' : '')}>
        Backup
      </NavLink>
    </nav>
  )
}
