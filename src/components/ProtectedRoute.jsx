import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute() {
  const { user, token } = useAuthStore()

  // Check if user has valid auth token - if not, redirect to login
  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  // Render nested routes
  return <Outlet />
}
