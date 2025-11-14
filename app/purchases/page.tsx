'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

interface Purchase {
  id: string
  supplier_name: string
  total_amount: number
  created_at: string
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    supplier_name: '',
    items: [] as Array<{
      product_id: string
      product_name: string
      batch_no: string
      qty: number
      purchase_price: number
      sale_price: number
      expiry_date: string
    }>,
  })
  const supabase = createClient()

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    setLoading(true)
    
    // Preview mode with seed data
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      const seedPurchases: Purchase[] = [
        { id: '1', supplier_name: 'MedSupply Co.', total_amount: 1250.00, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '2', supplier_name: 'Pharma Distributors', total_amount: 890.50, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '3', supplier_name: 'Health Products Inc.', total_amount: 2100.75, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '4', supplier_name: 'MedSupply Co.', total_amount: 675.25, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', supplier_name: 'Global Pharma', total_amount: 1540.00, created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      ]
      setPurchases(seedPurchases)
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

    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (purchasesData) {
      setPurchases(purchasesData)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.items.length === 0) {
      alert('Please add at least one item')
      return
    }

    try {
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase')
      }

      // Reset form
      setFormData({
        supplier_name: '',
        items: [],
      })
      setShowForm(false)
      loadPurchases()
      alert('Purchase created successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to create purchase')
    }
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
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('purchases.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('purchases.subtitle')}</p>
          </div>
          <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
            {t('purchases.addPurchase')}
          </Button>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
          >
            <h2 className={cn("text-xl font-semibold mb-6 gradient-text", isRTL && "text-right")}>{t('purchases.newPurchase')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('purchases.supplierName')}
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Purchase form - Add items with batch details. This will create stock batches.
                </p>
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Purchase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ supplier_name: '', items: [] })
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Purchases List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading purchases...</p>
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
                  <TableHead>{t('purchases.date')}</TableHead>
                  <TableHead>{t('purchases.supplier')}</TableHead>
                  <TableHead>{t('purchases.totalAmount')}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase, index) => (
                  <TableRow key={purchase.id} delay={index * 0.05}>
                    <TableCell className="text-gray-500 dark:text-gray-400">{formatDate(purchase.created_at)}</TableCell>
                    <TableCell className="font-medium">{purchase.supplier_name}</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(purchase.total_amount)}
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

