'use client'

import { motion } from 'framer-motion'
import { Package, AlertTriangle, TrendingUp, Bell } from 'lucide-react'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { formatCurrency } from '@/lib/utils'
import { useI18n } from '@/components/providers/i18n-provider'

interface DashboardCardsProps {
  totalSalesToday: number
  lowStockCount: number
  expiringCount: number
  unreadNotifications: number
}

export function DashboardCards({
  totalSalesToday,
  lowStockCount,
  expiringCount,
  unreadNotifications,
}: DashboardCardsProps) {
  const { t } = useI18n()
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <DashboardCard
        icon={TrendingUp}
        title={t('dashboard.todaySales')}
        value={formatCurrency(totalSalesToday)}
        iconColor="text-blue-600 dark:text-blue-400"
        gradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        delay={0}
      />
      <DashboardCard
        icon={Package}
        title={t('dashboard.lowStock')}
        value={lowStockCount}
        iconColor="text-yellow-600 dark:text-yellow-400"
        gradient="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
        delay={0.1}
      />
      <DashboardCard
        icon={AlertTriangle}
        title={t('dashboard.expiringSoon')}
        value={expiringCount}
        iconColor="text-red-600 dark:text-red-400"
        gradient="from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"
        delay={0.2}
      />
      <DashboardCard
        icon={Bell}
        title={t('dashboard.notifications')}
        value={unreadNotifications}
        iconColor="text-green-600 dark:text-green-400"
        gradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
        delay={0.3}
      />
    </motion.div>
  )
}

