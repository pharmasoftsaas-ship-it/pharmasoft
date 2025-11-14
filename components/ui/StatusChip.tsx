'use client'

import { cn } from '@/lib/utils'

interface StatusChipProps {
  status: 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const statusStyles = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
}

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function StatusChip({ status, children, size = 'md' }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        statusStyles[status],
        sizeStyles[size]
      )}
    >
      {children}
    </span>
  )
}

