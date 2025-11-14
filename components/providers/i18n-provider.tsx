'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Locale } from '@/lib/i18n/translations'
import { createClient } from '@/lib/supabase/client'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load locale from localStorage
    const savedLocale = localStorage.getItem('pharmasoft-locale') as Locale | null
    if (savedLocale && ['en', 'fr', 'ar'].includes(savedLocale)) {
      setLocaleState(savedLocale)
    } else {
      // Try to load from Supabase user metadata
      loadUserLocale()
    }
  }, [])

  const loadUserLocale = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.language) {
        const userLocale = user.user_metadata.language as Locale
        if (['en', 'fr', 'ar'].includes(userLocale)) {
          setLocaleState(userLocale)
          localStorage.setItem('pharmasoft-locale', userLocale)
        }
      }
    } catch (error) {
      console.error('Error loading user locale:', error)
    }
  }

  useEffect(() => {
    if (!mounted) return

    // Update HTML attributes
    const html = document.documentElement
    html.setAttribute('lang', locale)
    html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')

    // Save to localStorage
    localStorage.setItem('pharmasoft-locale', locale)

    // Save to Supabase user metadata
    saveLocaleToSupabase(locale)
  }, [locale, mounted])

  const saveLocaleToSupabase = async (newLocale: Locale) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            language: newLocale,
          },
        })
      }
    } catch (error) {
      console.error('Error saving locale to Supabase:', error)
    }
  }

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
  }

  const t = (key: string): string => {
    const translation = getNestedValue(translations[locale], key)
    return translation || key
  }

  const isRTL = locale === 'ar'

  // Always provide context, even during SSR/hydration
  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

