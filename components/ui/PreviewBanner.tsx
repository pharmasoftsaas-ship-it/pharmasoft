'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export function PreviewBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/60 shadow-lg mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 dark:via-yellow-600/10 animate-shimmer" />
      <div className="relative flex items-center gap-4 px-6 py-4">
        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
            Preview Mode
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
            Showing sample data. Configure Supabase credentials in .env.local to see real data.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

