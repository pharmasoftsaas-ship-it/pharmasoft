'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:ring-blue-500',
  secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-700 focus:ring-gray-500',
  outline: 'border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-gray-500',
} as const

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: keyof typeof variants
  icon?: LucideIcon
  children: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'primary',
  icon: Icon,
  children,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          {children}
        </>
      )}
    </motion.button>
  )
}

