import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Save, Lock, Bell, Shield } from 'lucide-react'

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    location: 'San Francisco, CA',
    title: 'Senior Engineer',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">Settings</h1>

            {/* Profile Settings */}
            <Card className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <CardTitle>Profile Information</CardTitle>
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
                      name="title"
                      value={profile.title}
                      onChange={handleProfileChange}
                    />
                  </div>
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

            {/* Security */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Lock size={20} className="text-white" />
                </div>
                <CardTitle>Security</CardTitle>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="font-semibold text-foreground mb-2">Change Password</div>
                  <p className="text-sm text-muted mb-4">
                    Update your password to keep your account secure
                  </p>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
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
                  <Button variant="outline" size="sm" className="text-red-400 border-red-400">
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
