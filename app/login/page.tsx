'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Starting login...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...')
      console.log('Supabase Key exists:', !!supabaseKey)
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        setError('Supabase is not configured. Please check your environment variables.')
        setLoading(false)
        return
      }
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      try {
        const { data: healthCheck } = await Promise.race([
          fetch(`${supabaseUrl}/rest/v1/`, { 
            method: 'HEAD',
            headers: { 'apikey': supabaseKey }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection test timed out')), 5000))
        ])
        console.log('Supabase connection test:', healthCheck?.status)
      } catch (healthError) {
        console.error('Supabase connection test failed:', healthError)
        setError('Cannot connect to Supabase. Please check your internet connection and Supabase project status.')
        setLoading(false)
        return
      }
      
      // Add timeout to prevent hanging
      console.log('Attempting authentication...')
      
      // Try direct API call since Supabase client is timing out
      console.log('Using direct API call for authentication...')
      let authData: any = null
      let authError: any = null
      
      try {
        const directAuthResponse = await Promise.race([
          fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
            },
            body: JSON.stringify({ email, password }),
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), 10000))
        ]) as Response
        
        console.log('Direct auth response status:', directAuthResponse.status)
        
        if (directAuthResponse.ok) {
          const responseData = await directAuthResponse.json()
          console.log('Auth successful, got tokens:', {
            hasAccessToken: !!responseData.access_token,
            hasRefreshToken: !!responseData.refresh_token,
            hasUser: !!responseData.user
          })
          
          // Store tokens in localStorage as fallback
          if (responseData.access_token) {
            localStorage.setItem(`sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`, JSON.stringify({
              access_token: responseData.access_token,
              refresh_token: responseData.refresh_token,
              expires_at: responseData.expires_at || Math.floor(Date.now() / 1000) + (responseData.expires_in || 3600),
              token_type: responseData.token_type || 'bearer',
              user: responseData.user
            }))
          }
          
          // Use user from response or decode from token
          if (responseData.user) {
            authData = { user: responseData.user }
            console.log('User data from response')
          } else if (responseData.access_token) {
            // Decode JWT to get user info
            try {
              const tokenParts = responseData.access_token.split('.')
              if (tokenParts[1]) {
                const payload = JSON.parse(atob(tokenParts[1]))
                authData = { 
                  user: { 
                    id: payload.sub, 
                    email: payload.email || email,
                    aud: payload.aud,
                    role: payload.role
                  } 
                }
                console.log('User data extracted from token')
              }
            } catch (e) {
              console.error('Could not decode token:', e)
              authError = { message: 'Could not decode authentication token' }
            }
          }
          
          if (responseData.access_token && responseData.refresh_token) {
            console.log('Setting session via API route...')
            // Use server-side API to set session (avoids client timeout)
            try {
              const sessionResponse = await fetch('/api/auth/set-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: responseData.access_token,
                  refresh_token: responseData.refresh_token,
                }),
              })
              
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json()
                console.log('Session set successfully via API')
                authData = { user: sessionData.user }
              } else {
                const errorData = await sessionResponse.json()
                console.error('Session API error:', errorData)
                authError = { message: errorData.error || 'Failed to set session' }
              }
            } catch (apiError: any) {
              console.error('Session API call failed:', apiError)
              // Still try to proceed with user data from token
              if (responseData.user) {
                authData = { user: responseData.user }
              } else if (responseData.access_token) {
                try {
                  const tokenParts = responseData.access_token.split('.')
                  if (tokenParts[1]) {
                    const payload = JSON.parse(atob(tokenParts[1]))
                    authData = { 
                      user: { 
                        id: payload.sub, 
                        email: payload.email || email
                      } 
                    }
                  }
                } catch (e) {
                  authError = { message: 'Failed to set session' }
                }
              }
            }
          }
          
          if (authData?.user) {
            console.log('Authentication successful, redirecting...')
            window.location.href = '/dashboard'
            return
          } else {
            authError = { message: 'Could not retrieve user information from authentication response' }
          }
        } else {
          const errorData = await directAuthResponse.json()
          console.error('Auth error:', errorData)
          authError = { message: errorData.error_description || errorData.message || 'Authentication failed' }
        }
      } catch (directError: any) {
        console.error('Direct auth failed:', directError)
        authError = directError
      }
      
      // Fallback to Supabase client if direct call fails
      if (authError && !authData) {
        console.log('Falling back to Supabase client...')
        const authPromise = supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login request timed out after 10 seconds.')), 10000)
        )
        
        const result = await Promise.race([authPromise, timeoutPromise]) as any
        if (result?.data) {
          authData = result.data
          authError = result.error
        } else {
          authError = result
        }
      }
      
      const { data, error } = { data: authData, error: authError }

      console.log('Auth response:', { data: data?.user?.id, error })

      if (error) {
        console.error('Auth error:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        console.log('User authenticated, checking users table...')
        // Verify user exists in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', data.user.id)
          .single()

        console.log('User data query result:', { userData, userError })

        if (userError || !userData) {
          console.error('User not found in users table:', userError)
          setError('User account not found. Please contact your administrator.')
          setLoading(false)
          // Sign out since user doesn't exist in users table
          await supabase.auth.signOut()
          return
        }

        console.log('Login successful, redirecting...')
        // Success - use window.location for full page reload to ensure session is set
        window.location.href = '/dashboard'
      } else {
        console.error('No user in auth response')
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 pointer-events-none" />
          
          <div className="relative p-8 space-y-8">
            {/* Logo/Branding */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={cn("text-center", isRTL && "text-right")}
            >
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold gradient-text mb-2">
                PharmaSoft
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('login.subtitle')}
              </p>
            </motion.div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <Input
                  icon={Mail}
                  type="email"
                  placeholder={t('login.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  icon={Lock}
                  type="password"
                  placeholder={t('login.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                icon={LogIn}
                className="w-full"
              >
                {t('login.signIn')}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

