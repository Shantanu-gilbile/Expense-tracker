import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, error } = useAuth()

  return (
    <div className="login-page">
      <h1>Expense Tracker</h1>
      <p>Sign in to track your expenses. Your data is private to your account.</p>
      <button onClick={signIn}>Sign in with Google</button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
