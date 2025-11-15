'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Edit, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { StatusChip } from '@/components/ui/StatusChip'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  sku: string
  name: string
  brand: string | null
  barcode: string | null
  critical_stock_level: number
}

interface Batch {
  id: string
  batch_no: string
  qty_on_hand: number
  purchase_price: number
  sale_price: number
  expiry_date: string
  product_id: string
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [nearExpiryFilter, setNearExpiryFilter] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { t, isRTL } = useI18n()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockFilter, nearExpiryFilter])

  const loadData = async () => {
    setLoading(true)
    
    // Preview mode with seed data
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
      const seedProducts: Product[] = [
        { id: '1', sku: 'MED001', name: 'Paracetamol 500mg', brand: 'Generic', barcode: '1234567890123', critical_stock_level: 50 },
        { id: '2', sku: 'MED002', name: 'Ibuprofen 400mg', brand: 'Advil', barcode: '1234567890124', critical_stock_level: 30 },
        { id: '3', sku: 'MED003', name: 'Amoxicillin 250mg', brand: 'Amoxil', barcode: '1234567890125', critical_stock_level: 20 },
        { id: '4', sku: 'MED004', name: 'Aspirin 100mg', brand: 'Bayer', barcode: '1234567890126', critical_stock_level: 100 },
        { id: '5', sku: 'MED005', name: 'Vitamin D3 1000IU', brand: 'Nature Made', barcode: '1234567890127', critical_stock_level: 40 },
        { id: '6', sku: 'MED006', name: 'Metformin 500mg', brand: 'Glucophage', barcode: '1234567890128', critical_stock_level: 25 },
      ]
      
      const seedBatches: Batch[] = [
        { id: 'b1', batch_no: 'BATCH001', qty_on_hand: 45, purchase_price: 2.50, sale_price: 5.00, expiry_date: '2024-12-31', product_id: '1' },
        { id: 'b2', batch_no: 'BATCH002', qty_on_hand: 120, purchase_price: 2.50, sale_price: 5.00, expiry_date: '2025-06-30', product_id: '1' },
        { id: 'b3', batch_no: 'BATCH003', qty_on_hand: 25, purchase_price: 3.00, sale_price: 6.50, expiry_date: '2024-11-15', product_id: '2' },
        { id: 'b4', batch_no: 'BATCH004', qty_on_hand: 80, purchase_price: 3.00, sale_price: 6.50, expiry_date: '2025-03-20', product_id: '2' },
        { id: 'b5', batch_no: 'BATCH005', qty_on_hand: 15, purchase_price: 4.50, sale_price: 9.00, expiry_date: '2024-10-20', product_id: '3' },
        { id: 'b6', batch_no: 'BATCH006', qty_on_hand: 200, purchase_price: 1.20, sale_price: 2.50, expiry_date: '2025-08-15', product_id: '4' },
        { id: 'b7', batch_no: 'BATCH007', qty_on_hand: 35, purchase_price: 5.00, sale_price: 10.00, expiry_date: '2025-01-10', product_id: '5' },
        { id: 'b8', batch_no: 'BATCH008', qty_on_hand: 20, purchase_price: 2.80, sale_price: 6.00, expiry_date: '2024-12-05', product_id: '6' },
      ]
      
      setProducts(seedProducts)
      setBatches(seedBatches)
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

    // Load products
    let productsQuery = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('name')

    const { data: productsData } = await productsQuery

    if (productsData) {
      setProducts(productsData)

      // Load batches
      const productIds = productsData.map(p => p.id)
      let batchesQuery = supabase
        .from('stock_batches')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .in('product_id', productIds)
        .gt('qty_on_hand', 0)

      if (nearExpiryFilter) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('near_expiry_days')
          .eq('id', userData.tenant_id)
          .single()

        const expiryThreshold = tenant?.near_expiry_days || 30
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + expiryThreshold)

        batchesQuery = batchesQuery
          .lte('expiry_date', expiryDate.toISOString().split('T')[0])
          .gt('expiry_date', new Date().toISOString().split('T')[0])
      }

      const { data: batchesData } = await batchesQuery
      setBatches(batchesData || [])
    }

    setLoading(false)
  }

  const getProductStock = (productId: string) => {
    return batches
      .filter(b => b.product_id === productId)
      .reduce((sum, b) => sum + b.qty_on_hand, 0)
  }

  const isLowStock = (product: Product) => {
    const totalStock = getProductStock(product.id)
    return totalStock <= product.critical_stock_level
  }

  const filteredProducts = products.filter(product => {
    if (lowStockFilter && !isLowStock(product)) {
      return false
    }
    if (nearExpiryFilter) {
      const productBatches = batches.filter(b => b.product_id === product.id)
      if (productBatches.length === 0) return false
    }
    return true
  })

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}
        >
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('inventory.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('inventory.subtitle')}</p>
          </div>
          <Button icon={Plus}>
            {t('inventory.addProduct')}
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-6"
        >
          <div className={cn("flex gap-6", isRTL && "flex-row-reverse")}>
            <label className={cn("flex items-center gap-3 cursor-pointer group", isRTL && "flex-row-reverse")}>
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{t('inventory.lowStockOnly')}</span>
            </label>
            <label className={cn("flex items-center gap-3 cursor-pointer group", isRTL && "flex-row-reverse")}>
              <input
                type="checkbox"
                checked={nearExpiryFilter}
                onChange={(e) => setNearExpiryFilter(e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{t('inventory.nearExpiryOnly')}</span>
            </label>
          </div>
        </motion.div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
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
                  <TableHead>{t('inventory.product')}</TableHead>
                  <TableHead>{t('inventory.sku')}</TableHead>
                  <TableHead>{t('inventory.barcode')}</TableHead>
                  <TableHead>{t('inventory.stock')}</TableHead>
                  <TableHead>{t('inventory.criticalLevel')}</TableHead>
                  <TableHead>{t('inventory.status')}</TableHead>
                  <TableHead>{t('inventory.actions')}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  const totalStock = getProductStock(product.id)
                  const productBatches = batches.filter(b => b.product_id === product.id)
                  const isLow = isLowStock(product)
                  
                  return (
                    <TableRow key={product.id} delay={index * 0.05} hover>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                        {product.brand && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{product.sku}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {product.barcode || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalStock}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{product.critical_stock_level}</TableCell>
                      <TableCell>
                        <StatusChip status={isLow ? 'error' : 'success'}>
                          {isLow ? t('inventory.lowStock') : t('inventory.inStock')}
                        </StatusChip>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedProduct(
                            selectedProduct === product.id ? null : product.id
                          )}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                          {selectedProduct === product.id ? t('inventory.hideBatches') : t('inventory.viewBatches')}
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Batch Details */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className={cn("text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {t('inventory.batchDetails')}
                  </h3>
                </div>
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>{t('inventory.batchNo')}</TableHead>
                        <TableHead>{t('inventory.quantity')}</TableHead>
                        <TableHead>{t('inventory.purchasePrice')}</TableHead>
                        <TableHead>{t('inventory.salePrice')}</TableHead>
                        <TableHead>{t('inventory.expiryDate')}</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {batches
                        .filter(b => b.product_id === selectedProduct)
                        .map((batch, idx) => (
                          <TableRow key={batch.id} delay={idx * 0.05}>
                            <TableCell className="font-mono font-medium">{batch.batch_no}</TableCell>
                            <TableCell>
                              <span className="font-semibold">{batch.qty_on_hand}</span>
                            </TableCell>
                            <TableCell>{formatCurrency(batch.purchase_price)}</TableCell>
                            <TableCell className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(batch.sale_price)}
                            </TableCell>
                            <TableCell>{formatDate(batch.expiry_date)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}

