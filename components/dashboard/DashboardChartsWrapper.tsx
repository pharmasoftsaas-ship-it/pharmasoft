'use client'

import { motion } from 'framer-motion'
import { DashboardCharts } from './Charts'

interface DashboardChartsWrapperProps {
  salesData: Array<{ date: string; sales: number }>
  topProducts: Array<{ name: string; qty: number }>
  revenueExpenses: Array<{ name: string; revenue: number; expenses: number }>
  stockLevels: Array<{ name: string; stock: number; critical: number }>
}

export function DashboardChartsWrapper(props: DashboardChartsWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <DashboardCharts {...props} />
    </motion.div>
  )
}

