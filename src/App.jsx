import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Jobs from './pages/Jobs'
import JobMatch from './pages/JobMatch'
import SkillDNA from './pages/SkillDNA'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Settings from './pages/Settings'
import ResetPassword from './pages/ResetPassword'
import InterviewPrep from './pages/InterviewPrep'
import MockInterview from './pages/MockInterview'
import PracticeTest from './pages/PracticeTest'
import Upgrade from './pages/Upgrade'
import Logout from './pages/Logout'
import CareerStudio from './pages/CareerStudio'
import CareerAutopilot from './pages/CareerAutopilot'
import AutoApplyKit from './pages/AutoApplyKit'
import PortfolioBuilder from './pages/PortfolioBuilder'
import Applications from './pages/Applications'
import BrandingToolkit from './pages/BrandingToolkit'
import InterviewScheduling from './pages/InterviewScheduling'
import RecruiterAccess from './pages/RecruiterAccess'
import SalaryGuidance from './pages/SalaryGuidance'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ProRoute from './components/ProRoute'
import CaddieAssistant from './components/CaddieAssistant'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/skill-dna" element={<SkillDNA />} />
            <Route path="/job-match/:jobId" element={<JobMatch />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/career-autopilot" element={<CareerAutopilot />} />
            <Route path="/career-studio" element={<CareerStudio />} />
            <Route path="/auto-apply-kit" element={<AutoApplyKit />} />
            <Route path="/portfolio-builder" element={<PortfolioBuilder />} />
            <Route path="/applications" element={<Applications />} />
            <Route element={<ProRoute />}>
              <Route path="/branding-toolkit" element={<BrandingToolkit />} />
              <Route path="/interview-scheduling" element={<InterviewScheduling />} />
              <Route path="/recruiter-access" element={<RecruiterAccess />} />
              <Route path="/salary-guidance" element={<SalaryGuidance />} />
              <Route path="/interview-prep" element={<InterviewPrep />} />
              <Route path="/mock-interview" element={<MockInterview />} />
              <Route path="/practice-test" element={<PracticeTest />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/upgrade" element={<Upgrade />} />
          </Route>
        </Route>

        {/* PUBLIC LOGOUT */}
        <Route path="/logout" element={<Logout />} />

        {/* CATCH ALL - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CaddieAssistant />
    </>
  )
}

export default App
