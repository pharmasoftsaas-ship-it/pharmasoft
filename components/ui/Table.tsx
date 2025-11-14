'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg bg-white dark:bg-slate-800">
      <table className={cn('min-w-full divide-y divide-slate-200 dark:divide-slate-700', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900 sticky top-0 z-10">
      {children}
    </thead>
  )
}

export function TableRow({ 
  children, 
  hover = true,
  delay = 0 
}: { 
  children: React.ReactNode
  hover?: boolean
  delay?: number
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={cn(
        'transition-colors duration-150',
        hover && 'hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer'
      )}
    >
      {children}
    </motion.tr>
  )
}

export function TableHead({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <th className={cn(
      'px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider',
      className
    )}>
      {children}
    </th>
  )
}

export function TableCell({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100', className)}>
      {children}
    </td>
  )
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">{children}</tbody>
}

