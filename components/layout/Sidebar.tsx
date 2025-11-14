'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'inventory', href: '/inventory', icon: Package },
  { key: 'sales', href: '/sales', icon: ShoppingCart },
  { key: 'purchases', href: '/purchases', icon: ShoppingBag },
  { key: 'reports', href: '/reports', icon: FileText },
  { key: 'accounting', href: '/accounting', icon: DollarSign },
  { key: 'settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ x: isRTL ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white border-r dark:border-slate-800/50 border-slate-700/50 backdrop-blur-xl",
        isRTL && "border-l border-r-0"
      )}
    >
      {/* Logo/Branding */}
      <div className={cn("flex items-center gap-3 px-6 py-6 border-b border-slate-700/50 dark:border-slate-800/50", isRTL && "flex-row-reverse")}>
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            PharmaSoft
          </h1>
          <p className="text-xs text-slate-400">Pharmacy Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                  isRTL && 'flex-row-reverse',
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-l-4 dark:border-blue-400 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 dark:hover:bg-slate-800/30',
                  isRTL && isActive && 'border-l-0 border-r-4'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative z-10 h-5 w-5 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
                  )}
                />
                <span className="relative z-10">{t(`nav.${item.key}`)}</span>
                {isActive && (
                  <motion.div
                    className={cn("absolute w-2 h-2 rounded-full bg-blue-500", isRTL ? "left-2" : "right-2")}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Theme & Language Controls */}
      <div className="p-4 border-t border-slate-700/50 dark:border-slate-800/50 space-y-3">
        <div className={cn("flex flex-col gap-3", isRTL && "items-end")}>
          <div className="w-full">
            <p className="text-xs text-slate-400 mb-2 px-2">{t('settings.theme')}</p>
            <ThemeToggle />
          </div>
          <div className="w-full">
            <p className="text-xs text-slate-400 mb-2 px-2">{t('settings.language')}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700/50 dark:border-slate-800/50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:text-white hover:bg-red-600/10 hover:border-red-500/20 border border-transparent transition-all duration-200",
            isRTL && "flex-row-reverse"
          )}
        >
          <LogOut className="h-5 w-5" />
          {t('nav.logout')}
        </motion.button>
      </div>
    </motion.div>
  )
}

