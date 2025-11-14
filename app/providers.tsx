'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserContextType {
  user: User | null
  tenantId: string | null
  loading: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  tenantId: null,
  loading: true,
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // Skip auth if Supabase is not configured
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url || 
          url === 'your_supabase_project_url' ||
          !url.startsWith('http')) {
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user?.id) {
          const userId: string = user.id
          const { data: userData } = await supabase
            .from('users')
            .select('id, tenant_id')
            .eq('id', userId)
            .single()
          
          if (userData) {
            setTenantId(userData.tenant_id)
          }
        }
      } catch (error) {
        // Silently fail if Supabase is not configured
        console.log('Supabase not configured, running in preview mode')
      }
      
      setLoading(false)
    }

    init()

    // Only subscribe to auth changes if Supabase is configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url && url !== 'your_supabase_project_url' && url.startsWith('http')) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          if (session?.user?.id) {
            try {
              const userId: string = session.user.id
              const { data: userData } = await supabase
                .from('users')
                .select('id, tenant_id')
                .eq('id', userId)
                .single()
              
              if (userData) {
                setTenantId(userData.tenant_id)
              }
            } catch (error) {
              // Silently fail
            }
          } else {
            setTenantId(null)
          }
          setLoading(false)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [supabase])

  return (
    <UserContext.Provider value={{ user, tenantId, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

