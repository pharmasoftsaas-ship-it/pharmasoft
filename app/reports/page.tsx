'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

interface ReportData {
  total_sales: number
  revenue: number
  profit: number
  units_sold: number
  top_products: Array<{ name: string; qty: number }>
  inventory_valuation: number
  expiring_items: number
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  useEffect(() => {
    loadReport()
  }, [period])

  const loadReport = async () => {
    setLoading(true)
    
    // Preview mode with seed data
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      const seedData: ReportData = {
        total_sales: period === 'daily' ? 45 : period === 'weekly' ? 312 : 1280,
        revenue: period === 'daily' ? 2847.50 : period === 'weekly' ? 19850.75 : 87500.00,
        profit: period === 'daily' ? 1423.75 : period === 'weekly' ? 9925.38 : 43750.00,
        units_sold: period === 'daily' ? 125 : period === 'weekly' ? 875 : 3600,
        top_products: [
          { name: 'Paracetamol 500mg', qty: period === 'daily' ? 35 : period === 'weekly' ? 245 : 1000 },
          { name: 'Ibuprofen 400mg', qty: period === 'daily' ? 28 : period === 'weekly' ? 196 : 800 },
          { name: 'Amoxicillin 250mg', qty: period === 'daily' ? 22 : period === 'weekly' ? 154 : 630 },
          { name: 'Aspirin 100mg', qty: period === 'daily' ? 18 : period === 'weekly' ? 126 : 520 },
          { name: 'Vitamin D3 1000IU', qty: period === 'daily' ? 12 : period === 'weekly' ? 84 : 350 },
        ],
        inventory_valuation: 15420.50,
        expiring_items: 3,
      }
      setReportData(seedData)
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/reports/generate?period=${period}`)
      if (!response.ok) {
        throw new Error('Failed to load report')
      }
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!reportData) return

    const csv = [
      ['Metric', 'Value'],
      ['Total Sales', reportData.total_sales],
      ['Revenue', formatCurrency(reportData.revenue)],
      ['Profit', formatCurrency(reportData.profit)],
      ['Units Sold', reportData.units_sold],
      ['Inventory Valuation', formatCurrency(reportData.inventory_valuation)],
      ['Expiring Items', reportData.expiring_items],
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportPDF = async () => {
    // PDF export would use jsPDF - simplified for now
    alert('PDF export feature - to be implemented with jsPDF')
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}
        >
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('reports.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('reports.subtitle')}</p>
          </div>
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            <Button
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={!reportData}
            >
              {t('reports.exportCSV')}
            </Button>
            <Button
              variant="secondary"
              icon={FileText}
              onClick={exportPDF}
              disabled={!reportData}
            >
              {t('reports.exportPDF')}
            </Button>
          </div>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
        >
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPeriod(p)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {t(`reports.${p}`)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Report Data */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading report...</p>
          </div>
        ) : reportData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { key: 'totalSales', value: reportData.total_sales, gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
              { key: 'revenue', value: formatCurrency(reportData.revenue), gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', iconColor: 'text-green-600 dark:text-green-400' },
              { key: 'profit', value: formatCurrency(reportData.profit), gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
              { key: 'unitsSold', value: reportData.units_sold, gradient: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20', iconColor: 'text-orange-600 dark:text-orange-400' },
              { key: 'inventoryValuation', value: formatCurrency(reportData.inventory_valuation), gradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
              { key: 'expiringItems', value: reportData.expiring_items, gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20', iconColor: 'text-red-600 dark:text-red-400' },
            ].map((metric, index) => (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-2xl bg-gradient-to-br ${metric.gradient} border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6`}
              >
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{t(`reports.${metric.key}`)}</h3>
                <p className={`text-3xl font-bold ${metric.iconColor}`}>{metric.value}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {t('reports.noData')}
          </div>
        )}

        {/* Top Products */}
        {reportData && reportData.top_products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900">
              <h2 className={cn("text-xl font-semibold text-gray-900 dark:text-gray-100", isRTL && "text-right")}>{t('reports.topProducts')}</h2>
            </div>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>{t('reports.topProducts')}</TableHead>
                  <TableHead>{t('reports.quantitySold')}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {reportData.top_products.map((product, index) => (
                  <TableRow key={index} delay={index * 0.05}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{product.qty}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}

