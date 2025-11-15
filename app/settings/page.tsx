'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { Save, Bell, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nearExpiryDays, setNearExpiryDays] = useState(30)
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
  })
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    
    // Preview mode check
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      // Seed data for preview
      setUserProfile({
        name: 'John Doe',
        email: 'john.doe@pharmacy.com',
      })
      setNearExpiryDays(30)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load user profile
      const { data: userData } = await supabase
        .from('users')
        .select('name, email, tenant_id')
        .eq('id', user.id)
        .single()

      if (userData) {
        setUserProfile({
          name: userData.name || '',
          email: userData.email || '',
        })

        // Load tenant settings
        const { data: tenant } = await supabase
          .from('tenants')
          .select('near_expiry_days')
          .eq('id', userData.tenant_id)
          .single()

        if (tenant) {
          setNearExpiryDays(tenant.near_expiry_days || 30)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Fallback to seed data on error
      setUserProfile({
        name: 'John Doe',
        email: 'john.doe@pharmacy.com',
      })
      setNearExpiryDays(30)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpiryThreshold = async () => {
    if (nearExpiryDays < 1 || nearExpiryDays > 180) {
      alert('Expiry threshold must be between 1 and 180 days')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings/update_expiry_threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ near_expiry_days: nearExpiryDays }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      alert('Settings saved successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({ name: userProfile.name })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      alert('Profile updated successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(isRTL && 'text-right')}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('settings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
        </motion.div>

        {/* Theme & Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
        >
          <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold gradient-text">{t('settings.theme')} & {t('settings.language')}</h2>
          </div>
          <div className={cn("space-y-4", isRTL && "text-right")}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.theme')}
              </label>
              <ThemeToggle />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.language')}
              </label>
              <LanguageSwitcher />
            </div>
          </div>
        </motion.div>

        {/* Expiry Threshold Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
        >
          <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold gradient-text">{t('settings.expirySettings')}</h2>
          </div>
          <div className={cn("space-y-4", isRTL && "text-right")}>
            <Input
              label={t('settings.expiryDays')}
              type="number"
              min="1"
              max="180"
              value={nearExpiryDays}
              onChange={(e) => setNearExpiryDays(parseInt(e.target.value) || 30)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.expiryDescription')}
            </p>
            <Button
              icon={Save}
              onClick={handleSaveExpiryThreshold}
              disabled={saving}
              loading={saving}
            >
              {t('settings.saveExpiry')}
            </Button>
          </div>
        </motion.div>

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
        >
          <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold gradient-text">{t('settings.userProfile')}</h2>
          </div>
          <div className={cn("space-y-4", isRTL && "text-right")}>
            <Input
              label={t('settings.name')}
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
            />
            <div>
              <Input
                label={t('settings.email')}
                type="email"
                value={userProfile.email}
                disabled
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.emailNote')}</p>
            </div>
            <Button
              icon={Save}
              onClick={handleSaveProfile}
              disabled={saving}
              loading={saving}
            >
              {t('settings.saveProfile')}
            </Button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}

