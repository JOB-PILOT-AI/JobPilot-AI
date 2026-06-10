import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import GithubCallback from './pages/GithubCallback'
import GoogleCallback from './pages/GoogleCallback'
import Jobs from './pages/Jobs'
import JobMatch from './pages/JobMatch'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Settings from './pages/Settings'
import MockInterview from './pages/MockInterview'
import Practice from './pages/Practice'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/auth/github/callback" element={<GithubCallback />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/job-match/:jobId" element={<JobMatch />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/practice" element={<Practice />} />
        </Route>
      </Route>

      {/* CATCH ALL - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
