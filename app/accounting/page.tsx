'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { StatusChip } from '@/components/ui/StatusChip'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

interface AccountingEntry {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  note: string | null
  created_at: string
}

export default function AccountingPage() {
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: 0,
    note: '',
  })
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    
    // Preview mode with seed data
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      const seedEntries: AccountingEntry[] = [
        { id: '1', type: 'income', category: 'Sales', amount: 2847.50, note: 'Daily sales revenue', created_at: new Date().toISOString() },
        { id: '2', type: 'expense', category: 'Rent', amount: 1200.00, note: 'Monthly pharmacy rent', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '3', type: 'expense', category: 'Utilities', amount: 350.75, note: 'Electricity and water', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '4', type: 'income', category: 'Services', amount: 500.00, note: 'Consultation fees', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', type: 'expense', category: 'Salaries', amount: 3500.00, note: 'Staff salaries', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '6', type: 'expense', category: 'Insurance', amount: 450.00, note: 'Business insurance', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '7', type: 'income', category: 'Sales', amount: 3120.25, note: 'Weekly sales', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '8', type: 'expense', category: 'Marketing', amount: 200.00, note: 'Advertising costs', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      ]
      setEntries(seedEntries)
      setLoading(false)
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    const { data: entriesData } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (entriesData) {
      setEntries(entriesData)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/accounting/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create entry')
      }

      setFormData({
        type: 'income',
        category: '',
        amount: 0,
        note: '',
      })
      setShowForm(false)
      loadEntries()
      alert('Entry created successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to create entry')
    }
  }

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)

  const netIncome = totalIncome - totalExpenses

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}
        >
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('accounting.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('accounting.subtitle')}</p>
          </div>
          <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
            {t('accounting.addEntry')}
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-800/60 shadow-lg p-6"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('accounting.totalIncome')}</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/60 dark:border-red-800/60 shadow-lg p-6"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('accounting.totalExpenses')}</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl bg-gradient-to-br ${
              netIncome >= 0 
                ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/60 dark:border-green-800/60' 
                : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/60 dark:border-red-800/60'
            } border shadow-lg p-6`}
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('accounting.netIncome')}</h3>
            <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netIncome)}
            </p>
          </motion.div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
          >
            <h2 className={cn("text-xl font-semibold mb-6 gradient-text", isRTL && "text-right")}>{t('accounting.newEntry')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", isRTL && "text-right")}>{t('accounting.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="income">{t('accounting.income')}</option>
                  <option value="expense">{t('accounting.expense')}</option>
                </select>
              </div>

              <Input
                label={t('accounting.category')}
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={t('accounting.category')}
              />

              <Input
                label={t('accounting.amount')}
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />

              <div>
                <label className={cn("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", isRTL && "text-right")}>{t('accounting.note')}</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                  placeholder={t('accounting.note')}
                />
              </div>

              <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
                <Button type="submit">{t('accounting.createEntry')}</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ type: 'income', category: '', amount: 0, note: '' })
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading entries...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>{t('accounting.date')}</TableHead>
                  <TableHead>{t('accounting.type')}</TableHead>
                  <TableHead>{t('accounting.category')}</TableHead>
                  <TableHead>{t('accounting.amount')}</TableHead>
                  <TableHead>{t('accounting.note')}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id} delay={index * 0.05}>
                    <TableCell className="text-gray-500 dark:text-gray-400">{formatDate(entry.created_at)}</TableCell>
                    <TableCell>
                      <StatusChip status={entry.type === 'income' ? 'success' : 'error'}>
                        {t(`accounting.${entry.type}`)}
                      </StatusChip>
                    </TableCell>
                    <TableCell className="font-medium">{entry.category}</TableCell>
                    <TableCell className={`font-semibold ${entry.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">{entry.note || '-'}</TableCell>
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

