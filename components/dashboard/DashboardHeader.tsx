'use client'

import { motion } from 'framer-motion'
import { useI18n } from '@/components/providers/i18n-provider'

export function DashboardHeader() {
  const { t, isRTL } = useI18n()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={isRTL ? 'text-right' : ''}
    >
      <h1 className="text-4xl font-bold gradient-text mb-2">{t('dashboard.title')}</h1>
      <p className="text-gray-600 dark:text-gray-400">{t('dashboard.subtitle')}</p>
    </motion.div>
  )
}

