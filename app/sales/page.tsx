'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Search, X, ScanLine, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

interface SaleItem {
  product_id: string
  product_name: string
  batch_id: string
  batch_no: string
  qty: number
  unit_price: number
  line_total: number
}

export default function SalesPage() {
  const [items, setItems] = useState<SaleItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  useEffect(() => {
    // Auto-focus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
    
    // Preview mode - add sample items
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      const sampleItems: SaleItem[] = [
        {
          product_id: '1',
          product_name: 'Paracetamol 500mg',
          batch_id: 'b1',
          batch_no: 'BATCH001',
          qty: 2,
          unit_price: 5.00,
          line_total: 10.00,
        },
        {
          product_id: '2',
          product_name: 'Ibuprofen 400mg',
          batch_id: 'b3',
          batch_no: 'BATCH003',
          qty: 1,
          unit_price: 6.50,
          line_total: 6.50,
        },
      ]
      setItems(sampleItems)
    }
  }, [])

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault()
      await addProductByBarcode(barcodeInput.trim())
      setBarcodeInput('')
    }
  }

  const addProductByBarcode = async (barcode: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        setError('User not found')
        return
      }

      // Find product by barcode
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('barcode', barcode)
        .single()

      if (!product) {
        setError(`Product with barcode ${barcode} not found`)
        // Show modal to add product (simplified - just show error for now)
        return
      }

      // Get FIFO batch
      const { data: batchData } = await supabase.rpc('get_fifo_batch', {
        p_tenant_id: userData.tenant_id,
        p_product_id: product.id,
        p_qty: 1,
      })

      if (!batchData || batchData.length === 0) {
        setError('No stock available for this product')
        return
      }

      const batch = batchData[0]

      // Add to sale items
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        batch_id: batch.batch_id,
        batch_no: batch.batch_no,
        qty: 1,
        unit_price: batch.sale_price,
        line_total: batch.sale_price,
      }

      // Check if item already exists, increment qty if so
      const existingIndex = items.findIndex(
        item => item.product_id === product.id && item.batch_id === batch.batch_id
      )

      if (existingIndex >= 0) {
        const updatedItems = [...items]
        updatedItems[existingIndex].qty += 1
        updatedItems[existingIndex].line_total = 
          updatedItems[existingIndex].qty * updatedItems[existingIndex].unit_price
        setItems(updatedItems)
      } else {
        setItems([...items, newItem])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
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

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(10)

    setSearchResults(products || [])
  }

  const addProductFromSearch = async (product: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    const { data: batchData } = await supabase.rpc('get_fifo_batch', {
      p_tenant_id: userData.tenant_id,
      p_product_id: product.id,
      p_qty: 1,
    })

    if (!batchData || batchData.length === 0) {
      setError('No stock available for this product')
      return
    }

    const batch = batchData[0]

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: product.name,
      batch_id: batch.batch_id,
      batch_no: batch.batch_no,
      qty: 1,
      unit_price: batch.sale_price,
      line_total: batch.sale_price,
    }

    const existingIndex = items.findIndex(
      item => item.product_id === product.id && item.batch_id === batch.batch_id
    )

    if (existingIndex >= 0) {
      const updatedItems = [...items]
      updatedItems[existingIndex].qty += 1
      updatedItems[existingIndex].line_total = 
        updatedItems[existingIndex].qty * updatedItems[existingIndex].unit_price
      setItems(updatedItems)
    } else {
      setItems([...items, newItem])
    }

    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateQty = (index: number, newQty: number) => {
    if (newQty < 1) return
    const updatedItems = [...items]
    updatedItems[index].qty = newQty
    updatedItems[index].line_total = updatedItems[index].qty * updatedItems[index].unit_price
    setItems(updatedItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      setError('No items in sale')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        setError('User not found')
        return
      }

      // Create sale via API
      const response = await fetch('/api/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.product_id,
            batch_id: item.batch_id,
            qty: item.qty,
            unit_price: item.unit_price,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create sale')
      }

      // Reset form
      setItems([])
      setBarcodeInput('')
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
      alert('Sale completed successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(isRTL && 'text-right')}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('sales.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('sales.subtitle')}</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {/* Barcode Scanner Input - Hidden but always focused */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeScan}
            className="sr-only"
            placeholder={t('sales.scannerDescription')}
            autoFocus
          />
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 shadow-lg p-5">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="p-2 rounded-xl bg-blue-500 dark:bg-blue-600 shadow-lg">
                <ScanLine className="h-5 w-5 text-white" />
              </div>
              <div className={cn(isRTL && "text-right")}>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {t('sales.scannerReady')}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('sales.scannerDescription')}
                </p>
              </div>
            </div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 opacity-50" />
          </div>
        </motion.div>

        {/* Manual Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Input
            icon={Search}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchProducts(e.target.value)
              setShowSearch(true)
            }}
            onFocus={() => setShowSearch(true)}
            placeholder={t('sales.searchPlaceholder')}
          />

          {showSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 w-full mt-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl max-h-60 overflow-y-auto"
            >
              {searchResults.map((product, idx) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => addProductFromSearch(product)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors",
                    isRTL && "text-right"
                  )}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('inventory.sku')}: {product.sku} {product.barcode && `| ${t('inventory.barcode')}: ${product.barcode}`}
                  </div>
                </motion.button>
              ))}
              <button
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="w-full text-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-b-2xl"
              >
                <X className={cn("inline h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                {t('common.close')}
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Sale Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {items.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('sales.noItems')}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('sales.noItemsDescription')}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900">
                <h2 className={cn("text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t('sales.saleItems')}
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>{t('sales.product')}</TableHead>
                    <TableHead>{t('sales.batch')}</TableHead>
                    <TableHead>{t('sales.qty')}</TableHead>
                    <TableHead>{t('sales.price')}</TableHead>
                    <TableHead>{t('sales.total')}</TableHead>
                    <TableHead>{t('inventory.actions')}</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} delay={index * 0.05}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{item.batch_no}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </TableCell>
                      <TableCell className="text-gray-500">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                      <TableCell>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </motion.button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-slate-200 dark:border-slate-700">
                <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('sales.total')}:</span>
                  <span className="text-2xl font-bold gradient-text">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Complete Sale Button */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={cn("flex", isRTL ? "justify-start" : "justify-end")}
          >
            <Button
              onClick={handleCompleteSale}
              disabled={loading}
              loading={loading}
              icon={ShoppingCart}
              className="px-8 py-4 text-lg"
            >
              {t('sales.completeSale')}
            </Button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}

