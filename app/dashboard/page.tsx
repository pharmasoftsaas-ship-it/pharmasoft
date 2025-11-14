import { MainLayout } from '@/components/layout/MainLayout'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/Charts'
import { PreviewBanner } from '@/components/ui/PreviewBanner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardCards } from '@/components/dashboard/DashboardCards'
import { DashboardChartsWrapper } from '@/components/dashboard/DashboardChartsWrapper'

async function getDashboardData(tenantId: string) {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Today's sales
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('tenant_id', tenantId)
    .gte('created_at', today.toISOString())

  const totalSalesToday = todaySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

  // Low stock products
  const { data: products } = await supabase
    .from('products')
    .select('id, critical_stock_level')
    .eq('tenant_id', tenantId)

  const productIds = products?.map(p => p.id) || []
  
  const { data: batches } = await supabase
    .from('stock_batches')
    .select('product_id, qty_on_hand')
    .eq('tenant_id', tenantId)
    .in('product_id', productIds)
  
  const stockByProduct = new Map<string, number>()
  batches?.forEach(batch => {
    const current = stockByProduct.get(batch.product_id) || 0
    stockByProduct.set(batch.product_id, current + batch.qty_on_hand)
  })

  const lowStockProducts = products?.filter(p => {
    const totalStock = stockByProduct.get(p.id) || 0
    return totalStock <= p.critical_stock_level
  }) || []

  // Expiring batches
  const { data: tenant } = await supabase
    .from('tenants')
    .select('near_expiry_days')
    .eq('id', tenantId)
    .single()

  const expiryThreshold = tenant?.near_expiry_days || 30
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + expiryThreshold)

  const { count: expiringCount } = await supabase
    .from('stock_batches')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gt('qty_on_hand', 0)
    .lte('expiry_date', expiryDate.toISOString().split('T')[0])
    .gt('expiry_date', new Date().toISOString().split('T')[0])

  // Unread notifications
  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'unread')

  return {
    totalSalesToday,
    lowStockCount: lowStockProducts?.length || 0,
    expiringCount: expiringCount || 0,
    unreadNotifications: unreadNotifications || 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Preview mode if Supabase is not configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url === 'your_supabase_project_url' || !url.startsWith('http')) {
    // Seed data for preview
    const seedData = {
      totalSalesToday: 2847.50,
      lowStockCount: 5,
      expiringCount: 3,
      unreadNotifications: 8,
    }
    
    // Chart data for preview
    const salesData = [
      { date: 'Mon', sales: 2100 },
      { date: 'Tue', sales: 2450 },
      { date: 'Wed', sales: 1980 },
      { date: 'Thu', sales: 2750 },
      { date: 'Fri', sales: 3200 },
      { date: 'Sat', sales: 2847 },
      { date: 'Sun', sales: 2650 },
    ]
    
    const topProducts = [
      { name: 'Paracetamol', qty: 245 },
      { name: 'Ibuprofen', qty: 196 },
      { name: 'Amoxicillin', qty: 154 },
      { name: 'Aspirin', qty: 126 },
      { name: 'Vitamin D3', qty: 84 },
    ]
    
    const revenueExpenses = [
      { name: 'Week 1', revenue: 19850, expenses: 12000 },
      { name: 'Week 2', revenue: 22500, expenses: 13500 },
      { name: 'Week 3', revenue: 21000, expenses: 12800 },
      { name: 'Week 4', revenue: 24100, expenses: 14200 },
    ]
    
    const stockLevels = [
      { name: 'Paracetamol', stock: 165, critical: 50 },
      { name: 'Ibuprofen', stock: 105, critical: 30 },
      { name: 'Amoxicillin', stock: 15, critical: 20 },
      { name: 'Aspirin', stock: 200, critical: 100 },
      { name: 'Vitamin D3', stock: 35, critical: 40 },
      { name: 'Metformin', stock: 20, critical: 25 },
    ]
    
    return (
      <MainLayout>
        <div className="space-y-8">
          <DashboardHeader />
          
          <PreviewBanner />
          
          <DashboardCards
            totalSalesToday={seedData.totalSalesToday}
            lowStockCount={seedData.lowStockCount}
            expiringCount={seedData.expiringCount}
            unreadNotifications={seedData.unreadNotifications}
          />
          
          <DashboardChartsWrapper
            salesData={salesData}
            topProducts={topProducts}
            revenueExpenses={revenueExpenses}
            stockLevels={stockLevels}
          />
        </div>
      </MainLayout>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (userDataError || !userData) {
    console.error('Error fetching user data:', userDataError)
    redirect('/login')
  }

  let dashboardData
  try {
    dashboardData = await getDashboardData(userData.tenant_id)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return empty data if there's an error
    dashboardData = {
      totalSalesToday: 0,
      lowStockCount: 0,
      expiringCount: 0,
      unreadNotifications: 0,
    }
  }

  // Get chart data (simplified - in production, fetch from database)
  const salesData = [
    { date: 'Mon', sales: 2100 },
    { date: 'Tue', sales: 2450 },
    { date: 'Wed', sales: 1980 },
    { date: 'Thu', sales: 2750 },
    { date: 'Fri', sales: 3200 },
    { date: 'Sat', sales: 2847 },
    { date: 'Sun', sales: 2650 },
  ]
  
  const topProducts = [
    { name: 'Paracetamol', qty: 245 },
    { name: 'Ibuprofen', qty: 196 },
    { name: 'Amoxicillin', qty: 154 },
    { name: 'Aspirin', qty: 126 },
    { name: 'Vitamin D3', qty: 84 },
  ]
  
  const revenueExpenses = [
    { name: 'Week 1', revenue: 19850, expenses: 12000 },
    { name: 'Week 2', revenue: 22500, expenses: 13500 },
    { name: 'Week 3', revenue: 21000, expenses: 12800 },
    { name: 'Week 4', revenue: 24100, expenses: 14200 },
  ]
  
  const stockLevels = [
    { name: 'Paracetamol', stock: 165, critical: 50 },
    { name: 'Ibuprofen', stock: 105, critical: 30 },
    { name: 'Amoxicillin', stock: 15, critical: 20 },
    { name: 'Aspirin', stock: 200, critical: 100 },
    { name: 'Vitamin D3', stock: 35, critical: 40 },
    { name: 'Metformin', stock: 20, critical: 25 },
  ]

  return (
    <MainLayout>
      <div className="space-y-8">
        <DashboardHeader />

        <DashboardCards
          totalSalesToday={dashboardData.totalSalesToday}
          lowStockCount={dashboardData.lowStockCount}
          expiringCount={dashboardData.expiringCount}
          unreadNotifications={dashboardData.unreadNotifications}
        />
        
        <DashboardChartsWrapper
          salesData={salesData}
          topProducts={topProducts}
          revenueExpenses={revenueExpenses}
          stockLevels={stockLevels}
        />
      </div>
    </MainLayout>
  )
}

