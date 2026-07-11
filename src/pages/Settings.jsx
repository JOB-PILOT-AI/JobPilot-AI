import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Save, Lock, Bell, Shield, Download, Trash2 } from 'lucide-react'
import ErrorBoundary from '../components/ErrorBoundary'
import SocialButtons from '../components/SocialButtons'
import ProBadge from '../components/ProBadge'
import { useAuthStore } from '../store/authStore'

export default function Settings() {
  const { user, updateProfile, changePassword, logout } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    location: '',
    currentRole: '',
    yearsExperience: '',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
  })
  const [privacy, setPrivacy] = useState({
    allowCaddieContext: true,
    allowResumeAnalysis: true,
    allowJobPersonalization: true,
  })
  const [saveMessage, setSaveMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!user) return

    setProfile({
      name: user.name || '',
      email: user.email || '',
      location: user.location || '',
      currentRole: user.currentRole || '',
      yearsExperience: user.yearsExperience ? String(user.yearsExperience) : '',
    })

    setNotifications({
      emailNotifications: user.notificationPreferences?.emailNotifications ?? true,
      jobAlerts: user.notificationPreferences?.jobAlerts ?? true,
      applicationUpdates: user.notificationPreferences?.applicationUpdates ?? true,
    })
    setPrivacy({
      allowCaddieContext: user.privacyPreferences?.allowCaddieContext ?? true,
      allowResumeAnalysis: user.privacyPreferences?.allowResumeAnalysis ?? true,
      allowJobPersonalization: user.privacyPreferences?.allowJobPersonalization ?? true,
    })
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    const updatePayload = {
      name: profile.name,
      email: profile.email,
      location: profile.location,
      currentRole: profile.currentRole,
      yearsExperience: profile.yearsExperience ? Number(profile.yearsExperience) : undefined,
      notificationPreferences: notifications,
      privacyPreferences: privacy,
    }

    const result = await updateProfile(updatePayload)
    if (result.success) {
      setSaveMessage('Profile updated successfully.')
    } else {
      setSaveMessage(result.error || 'Unable to save settings.')
    }

    setIsSaving(false)
  }

  const exportData = async () => {
    setSaveMessage('')
    try {
      const response = await axios.get('/api/auth/me/export', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'jobpilot-data.json'
      link.click()
      URL.revokeObjectURL(url)
      setSaveMessage('Your data export is ready.')
    } catch {
      setSaveMessage('Unable to export account data.')
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Permanently delete your JobPilot account, resumes, applications, and generated assets?')) return
    try {
      await axios.delete('/api/auth/me')
      logout()
      window.location.assign('/')
    } catch {
      setPasswordMessage('Unable to delete the account.')
    }
  }

  const handleChangePassword = async () => {
    setPasswordMessage('')
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordMessage('The new password must be at least 6 characters.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('The password confirmation does not match.')
      return
    }

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })

    if (result.success) {
      setPasswordMessage(result.message || 'Password changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      setPasswordMessage(result.error || 'Unable to change password.')
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground px-6 py-10">
        <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Settings</h1>

        {/* Profile Settings */}
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle>Profile Information</CardTitle>
              <ProBadge compact />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Full Name
                </label>
                <Input
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Location
                </label>
                <Input
                  name="location"
                  value={profile.location}
                  onChange={handleProfileChange}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Current Title
                </label>
                <Input
                  name="currentRole"
                  value={profile.currentRole}
                  onChange={handleProfileChange}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Years of Experience
                </label>
                <Input
                  name="yearsExperience"
                  type="number"
                  min="0"
                  value={profile.yearsExperience}
                  onChange={handleProfileChange}
                />
              </div>
              <div />
            </div>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            {saveMessage && (
              <p className="mt-3 text-sm text-foreground">{saveMessage}</p>
            )}
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <CardTitle>Notification Preferences</CardTitle>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'emailNotifications',
                label: 'Email Notifications',
                description: 'Receive email updates about your account',
              },
              {
                key: 'jobAlerts',
                label: 'Job Alerts',
                description: 'Get notified about new job matches',
              },
              {
                key: 'applicationUpdates',
                label: 'Application Updates',
                description: 'Receive updates on your applications',
              },
            ].map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-tertiary/50 transition"
              >
                <div>
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="text-sm text-muted">{description}</div>
                </div>
                <button
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    notifications[key] ? 'bg-primary' : 'bg-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      notifications[key] ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <CardTitle>AI & Privacy Controls</CardTitle>
              <CardContent>Choose which personal context JobPilot may use for assistance and recommendations.</CardContent>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ['allowCaddieContext', 'Contextual Caddie', 'Allow Caddie to use your resume and application pipeline when relevant.'],
              ['allowResumeAnalysis', 'Resume analysis', 'Allow AI tools to analyze resume content you provide.'],
              ['allowJobPersonalization', 'Personalized matching', 'Use your profile to rank and explain job matches.'],
            ].map(([key, label, description]) => (
              <div key={key} className="flex items-center justify-between gap-5 rounded-lg border border-border p-4">
                <div><div className="font-semibold text-foreground">{label}</div><div className="text-sm text-muted">{description}</div></div>
                <button
                  type="button"
                  aria-pressed={privacy[key]}
                  aria-label={`Toggle ${label}`}
                  onClick={() => setPrivacy((current) => ({ ...current, [key]: !current[key] }))}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${privacy[key] ? 'bg-primary' : 'bg-tertiary'}`}
                >
                  <span className={`inline-block h-6 w-6 rounded-full bg-white transition ${privacy[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="mt-5">
            <Save size={16} className="mr-2" /> Save privacy choices
          </Button>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            <CardTitle>Security</CardTitle>
          </div>

          <div className="space-y-6">
            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-2">Change Password</div>
              <p className="text-sm text-muted mb-4">Update your password to keep your account secure.</p>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Current password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
                <Input
                  placeholder="New password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
                <Input
                  placeholder="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="mt-4">
                <Button variant="primary" size="sm" onClick={handleChangePassword}>
                  Change Password
                </Button>
                {passwordMessage && <p className="mt-3 text-sm text-foreground">{passwordMessage}</p>}
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-2">Two-Factor Authentication</div>
              <p className="text-sm text-muted mb-4">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>

            <div className="p-4 border border-border rounded-lg bg-red-500/5">
              <div className="font-semibold text-red-400 mb-2">Delete Account</div>
              <p className="text-sm text-muted mb-4">
                Permanently delete your account and all associated data
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download size={15} className="mr-2" /> Export My Data
                </Button>
                <Button variant="outline" size="sm" className="text-red-400 border-red-400" onClick={deleteAccount}>
                  <Trash2 size={15} className="mr-2" /> Delete Account
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <SocialButtons />
          </div>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  )
}
