import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { user, signOut } = useAuth()

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

      <div className="navbar-user">
        {user?.photoURL && <img src={user.photoURL} alt="" className="user-avatar" />}
        <span className="user-name">{user?.displayName ?? user?.email}</span>
        <button className="secondary" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
