import React, { useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { backendUrl as defaultBackendUrl } from '../config'
import { useDashboardStore } from '../store/useDashboardStore'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = ['#8BD1FF', '#FFE066', '#FBC4AB', '#C7F0DB', '#C4B5FD', '#FDBA74']
const PERIODS = [
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
  { value: 'all', label: 'ALL' },
]

const numberLike = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  })

const stringLike = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => (value == null ? '' : String(value)))

const statSchema = z
  .object({
    totalRevenue: numberLike,
    totalProfit: numberLike,
    totalCustomers: numberLike,
    pendingOrders: numberLike,
    grossMargin: numberLike,
    inventoryValue: numberLike,
    totalProducts: numberLike,
  })
  .passthrough()

const financialPointSchema = z
  .object({
    name: stringLike,
    revenue: numberLike,
  })
  .passthrough()

const categoryPointSchema = z
  .object({
    name: stringLike.optional(),
    _id: stringLike.optional(),
    value: numberLike,
  })
  .passthrough()

const chartSchema = z
  .object({
    financial: z.array(financialPointSchema).catch([]),
    categories: z.array(categoryPointSchema).catch([]),
  })
  .passthrough()

const addressSchema = z
  .object({
    fullName: stringLike.optional(),
    firstName: stringLike.optional(),
    lastName: stringLike.optional(),
  })
  .partial()
  .catch({})

const orderSchema = z
  .object({
    _id: stringLike.optional(),
    amount: numberLike,
    date: numberLike,
    status: stringLike.optional(),
    address: addressSchema.optional(),
  })
  .passthrough()

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 22,
      mass: 0.85,
    },
  },
}

const topCardPalettes = [
  {
    card: 'from-[#FCF8F2] to-[#F2E7D7]',
    iconFrame: 'bg-white/92 ring-1 ring-white/80 shadow-[0_16px_36px_rgba(231,137,103,0.18)]',
    iconWrap: 'bg-[#F6EFE5] text-[#8C6A2A]',
    border: 'border-[#E7D8C4]',
    glow: 'shadow-[0_18px_45px_rgba(109,86,47,0.10)]',
  },
  {
    card: 'from-[#F8F4ED] to-[#EFE7DB]',
    iconFrame: 'bg-white/92 ring-1 ring-white/80 shadow-[0_16px_36px_rgba(78,168,222,0.18)]',
    iconWrap: 'bg-[#F3ECE1] text-[#43362C]',
    border: 'border-[#E5D9C9]',
    glow: 'shadow-[0_18px_45px_rgba(67,54,44,0.08)]',
  },
  {
    card: 'from-[#F8F1E6] to-[#EEDFC3]',
    iconFrame: 'bg-white/92 ring-1 ring-white/80 shadow-[0_16px_36px_rgba(214,158,0,0.18)]',
    iconWrap: 'bg-[#FBF4E7] text-[#9A7220]',
    border: 'border-[#E4D2B1]',
    glow: 'shadow-[0_18px_45px_rgba(154,114,32,0.10)]',
  },
]

const getStatusClass = (status) => {
  if (status === 'Delivered') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  if (status === 'Shipped' || status === 'Out for Delivery') return 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
  if (status === 'Packing') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

const DashboardIcon = ({ icon, size = 18, className = '' }) => (
  <Icon icon={icon} width={size} height={size} className={className} />
)

const QueryError = ({ message, onRetry }) => (
  <Card className='border-rose-200 bg-white/96 text-center'>
    <CardHeader className='px-6 py-8'>
      <CardTitle className='text-base text-slate-900'>Dashboard failed to load</CardTitle>
      <CardDescription className='mt-1'>{message}</CardDescription>
      <div className='pt-2'>
        <Button type='button' onClick={onRetry}>
          <DashboardIcon icon='mdi:refresh' size={16} />
          Try again
        </Button>
      </div>
    </CardHeader>
  </Card>
)

const PanelHeader = ({ eyebrow, title, description, icon: Icon, iconClass = 'bg-slate-100 text-slate-600', action }) => (
  <CardHeader className='flex-row items-start justify-between space-y-0 p-0'>
    <div className='min-w-0'>
      <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400'>{eyebrow}</p>
      <CardTitle className='mt-1 text-[18px] font-semibold tracking-tight text-slate-900'>{title}</CardTitle>
      {description ? <CardDescription className='mt-1 text-sm text-slate-500'>{description}</CardDescription> : null}
    </div>
    {action || Icon ? (
      action || (
        <div className='rounded-[20px] bg-white/95 p-1.5 shadow-[0_14px_32px_rgba(31,26,23,0.08)] ring-1 ring-[#efe5d8] backdrop-blur'>
          <div className={`flex h-10 w-10 items-center justify-center rounded-[16px] shadow-inner ${iconClass}`}>
            <DashboardIcon icon={Icon} size={18} />
          </div>
        </div>
      )
    ) : null}
  </CardHeader>
)

const DashboardAction = ({ icon: Icon, children, className = '', ...props }) => (
  <Button type='button' variant='secondary' className={className} {...props}>
    <DashboardIcon icon={Icon} size={16} />
    {children}
  </Button>
)

const StatCard = ({ label, sublabel, value, icon, palette }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden border bg-gradient-to-br p-3.5 ${palette.card} ${palette.border} ${palette.glow}`}
    >
      <div className='relative z-10 flex items-start justify-between gap-3'>
        <div className={`inline-flex rounded-full p-1 ${palette.iconFrame}`}>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${palette.iconWrap}`}>
            <DashboardIcon icon={icon} size={16} />
          </div>
        </div>
        <span className='rounded-full bg-white/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500'>
          KPI
        </span>
      </div>
      <div className='pointer-events-none absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-white/25 blur-2xl' />
      <div className='pointer-events-none absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-white/60' />
      <div className='relative z-10 mt-3'>
        <p className='text-[clamp(1.35rem,1.7vw,1.85rem)] font-semibold tracking-tight text-slate-900'>{value}</p>
        <p className='mt-1 text-[13.5px] font-semibold text-slate-900'>{label}</p>
        <p className='mt-0.5 text-[12px] text-slate-500'>{sublabel}</p>
      </div>
    </motion.div>
  )
}

const MiniMetric = ({ label, value, icon, iconClass }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className='border border-[#e7ddcf] bg-[#fbf7f1] px-3.5 py-3 text-left text-slate-900 transition hover:-translate-y-0.5 hover:bg-white'
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>{label}</p>
          <p className='mt-1.5 text-[18px] font-semibold tracking-tight text-slate-900'>{value}</p>
        </div>
        <div className='rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[#eadfce]'>
          <div className={`flex h-8 w-8 items-center justify-center rounded-2xl ${iconClass}`}>
            <DashboardIcon icon={icon} size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const CategoryMetricCard = ({ label, value, icon, cardClass, iconClass, active, onClick }) => {
  return (
    <motion.button
      type='button'
      variants={itemVariants}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`px-3 py-2.5 text-left shadow-sm ring-1 transition ${cardClass} ${
        active ? 'ring-slate-900/20 shadow-[0_14px_30px_rgba(15,23,42,0.12)]' : 'ring-transparent'
      }`}
    >
      <div className='flex items-start gap-3'>
        <div className='rounded-full bg-white/92 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.06)] ring-1 ring-white/80'>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <DashboardIcon icon={icon} size={14} />
          </div>
        </div>
        <div className='min-w-0'>
          <p className='truncate text-[12.5px] font-medium text-slate-900'>{label}</p>
          <p className='mt-1 text-[19px] font-semibold leading-none tracking-tight text-slate-900'>{value}</p>
        </div>
      </div>
    </motion.button>
  )
}

const getCustomerName = (address = {}) =>
  address?.fullName || [address?.firstName, address?.lastName].filter(Boolean).join(' ') || 'Unknown customer'

const buildCategorySummary = (categoryData) => {
  const preferredMatchers = [
    /^(men|man|male|nam)$/i,
    /^(women|woman|female|nữ|nu)$/i,
    /^(accessories|accessory|phụ kiện|phu kien)$/i,
    /^(kids|kid|children|child|trẻ em|tre em)$/i,
  ]

  const palettes = [
    { cardClass: 'bg-[#FDE6DC]', iconClass: 'text-[#E78967]' },
    { cardClass: 'bg-[#D9F0FF]', iconClass: 'text-[#4EA8DE]' },
    { cardClass: 'bg-[#FFE97D]', iconClass: 'text-[#D69E00]' },
    { cardClass: 'bg-[#DDF7E7]', iconClass: 'text-[#3FA46A]' },
  ]
  const icons = ['mdi:hanger', 'mdi:account-group-outline', 'mdi:watch-variant', 'mdi:teddy-bear']
  const picked = []
  const used = new Set()

  preferredMatchers.forEach((matcher, index) => {
    const itemIndex = categoryData.findIndex((item, rawIndex) => {
      const name = String(item?.name || item?._id || '').trim()
      return !used.has(rawIndex) && matcher.test(name)
    })

    if (itemIndex >= 0) {
      used.add(itemIndex)
      const item = categoryData[itemIndex]
      picked.push({
        label: item?.name || item?._id || `Category ${index + 1}`,
        value: item?.value || 0,
        icon: icons[index],
        ...palettes[index],
      })
    }
  })

  if (picked.length < 4) {
    categoryData.forEach((item, index) => {
      if (picked.length >= 4 || used.has(index)) return
      picked.push({
        label: item?.name || item?._id || `Category ${picked.length + 1}`,
        value: item?.value || 0,
        icon: icons[picked.length] || 'mdi:shape-outline',
        ...palettes[picked.length],
      })
    })
  }

  return picked.slice(0, 4)
}

const parseDashboardPayload = (statsResponse, ordersResponse) => {
  const statsResult = z
    .object({
      success: z.boolean().optional(),
      stats: statSchema,
      charts: chartSchema,
    })
    .safeParse(statsResponse)

  const ordersResult = z
    .object({
      success: z.boolean().optional(),
      orders: z.array(orderSchema).catch([]),
    })
    .safeParse(ordersResponse)

  if (!statsResult.success) {
    throw new Error('Dashboard stats payload is invalid')
  }

  if (!ordersResult.success) {
    throw new Error('Recent orders payload is invalid')
  }

  return {
    stats: statsResult.data.stats,
    charts: statsResult.data.charts,
    recentOrders: [...ordersResult.data.orders].sort((a, b) => b.date - a.date).slice(0, 5),
  }
}

const fetchDashboardData = async ({ apiBaseUrl, token }) => {
  const [statsRes, orderRes] = await Promise.all([
    axios.get(`${apiBaseUrl}/api/dashboard/stats`, { headers: { token } }),
    axios.post(`${apiBaseUrl}/api/order/list`, {}, { headers: { token } }),
  ])

  return parseDashboardPayload(statsRes.data, orderRes.data)
}

const Dashboard = ({ token, backendUrl: backendUrlFromProps }) => {
  const queryClient = useQueryClient()
  const {
    period,
    selectedOrderId,
    selectedCategory,
    setPeriod,
    setSelectedOrderId,
    setSelectedCategory,
  } = useDashboardStore((state) => state)

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const handleUnauthorized = useCallback((message) => {
    const normalized = (message || '').toLowerCase()
    if (!normalized.includes('not authorized')) return false

    toast.error('Session expired, please login again')
    localStorage.removeItem('token')
    setTimeout(() => window.location.reload(), 400)
    return true
  }, [])

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', apiBaseUrl, token],
    queryFn: () => fetchDashboardData({ apiBaseUrl, token }),
    enabled: Boolean(apiBaseUrl && token),
    staleTime: 45000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!dashboardQuery.error) return

    const message =
      dashboardQuery.error?.response?.data?.message ||
      dashboardQuery.error?.message ||
      'Cannot load dashboard'

    if (handleUnauthorized(message)) return
    toast.error(message)
  }, [dashboardQuery.error, handleUnauthorized])

  const data = dashboardQuery.data
  const stats = data?.stats
  const charts = data?.charts
  const recentOrders = data?.recentOrders || []

  const topMetrics = useMemo(() => {
    if (!stats) return []

    return [
      {
        key: 'revenue',
        label: 'Gross Revenue',
        sublabel: 'Store sales',
        value: currencyFormatter.format(stats.totalRevenue || 0),
        icon: 'mdi:cash-multiple',
      },
      {
        key: 'profit',
        label: 'Gross Profit',
        sublabel: 'Net after COGS',
        value: currencyFormatter.format(stats.totalProfit || 0),
        icon: 'mdi:trending-up',
      },
      {
        key: 'customers',
        label: 'Customers',
        sublabel: 'Registered user',
        value: stats.totalCustomers || 0,
        icon: 'mdi:account-group-outline',
      },
    ]
  }, [currencyFormatter, stats])

  const chartMetrics = useMemo(() => {
    if (!stats) return []

    return [
      {
        key: 'orders',
        label: 'Pending Orders',
        value: stats.pendingOrders || 0,
        icon: 'mdi:clock-outline',
        iconClass: 'bg-emerald-100 text-emerald-600',
      },
      {
        key: 'margin',
        label: 'Gross Margin',
        value: `${stats.grossMargin || 0}%`,
        icon: 'mdi:chart-line',
        iconClass: 'bg-violet-100 text-violet-600',
      },
      {
        key: 'inventory',
        label: 'Inventory Value',
        value: currencyFormatter.format(stats.inventoryValue || 0),
        icon: 'mdi:database-outline',
        iconClass: 'bg-cyan-100 text-cyan-600',
      },
      {
        key: 'products',
        label: 'Live Products',
        value: stats.totalProducts || 0,
        icon: 'mdi:package-variant-closed',
        iconClass: 'bg-amber-100 text-amber-600',
      },
    ]
  }, [currencyFormatter, stats])

  const financialData = useMemo(() => {
    const source = charts?.financial || []
    if (period === '6m') return source.slice(-6)
    if (period === '12m') return source.slice(-12)
    return source
  }, [charts?.financial, period])

  const categoryData = useMemo(() => charts?.categories || [], [charts?.categories])
  const categorySummary = useMemo(() => buildCategorySummary(categoryData), [categoryData])
  const categoryTotal = useMemo(
    () => categoryData.reduce((total, item) => total + Number(item?.value || 0), 0),
    [categoryData],
  )

  const selectedCategoryLabel = selectedCategory || categorySummary[0]?.label || null

  const selectedCategoryValue = useMemo(() => {
    if (!selectedCategoryLabel) return null
    return categorySummary.find((item) => item.label === selectedCategoryLabel)?.value ?? null
  }, [categorySummary, selectedCategoryLabel])

  const handleExport = useCallback(async () => {
    if (!apiBaseUrl || !token) return

    try {
      const response = await axios.get(`${apiBaseUrl}/api/dashboard/export-orders`, {
        headers: { token },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(
        new Blob(['\uFEFF' + response.data], { type: 'text/csv;charset=utf-8;' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'DonHang_BaoCao.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    }
  }, [apiBaseUrl, token])

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard', apiBaseUrl, token] })
  }, [apiBaseUrl, queryClient, token])

  const isInitialLoading = dashboardQuery.isLoading && !dashboardQuery.data

  if (isInitialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='grid gap-4 px-4 py-5 md:px-8'
      >
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='h-[132px] animate-pulse rounded-[26px] bg-white shadow-sm' />
          ))}
        </div>
        <div className='grid gap-4 xl:grid-cols-[1.6fr_0.95fr]'>
          <div className='h-[420px] animate-pulse rounded-[30px] bg-white shadow-sm' />
          <div className='h-[420px] animate-pulse rounded-[30px] bg-white shadow-sm' />
        </div>
        <div className='h-[320px] animate-pulse rounded-[30px] bg-white shadow-sm' />
      </motion.div>
    )
  }

  if (dashboardQuery.isError && !dashboardQuery.data) {
    return (
      <div className='px-4 py-5 md:px-8'>
        <QueryError
          message={dashboardQuery.error?.message || 'Cannot load dashboard right now.'}
          onRetry={handleRefresh}
        />
      </div>
    )
  }

  return (
    <div className='w-full px-4 py-4 md:px-6 xl:px-8'>
      <motion.div transition={{ duration: 0.2 }} className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Badge variant='outline' className='mb-2 bg-white/70 text-[#8b7c6e]'>
            Executive Overview
          </Badge>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <DashboardAction icon='mdi:download' onClick={handleExport}>
            Export CSV
          </DashboardAction>
          <DashboardAction
            icon='mdi:refresh'
            onClick={handleRefresh}
            className='bg-[#1f1a17] text-white hover:bg-[#2a221d] hover:text-white'
          >
            {dashboardQuery.isFetching ? 'Refreshing...' : 'Refresh Data'}
          </DashboardAction>
        </div>
      </motion.div>

      <div className='overflow-x-auto pb-1 no-scrollbar'>
        <div className='flex min-w-[900px] flex-nowrap gap-4'>
          {topMetrics.map((metric, index) => (
            <div key={metric.key} className='min-w-[260px] flex-1 basis-0'>
              <StatCard {...metric} palette={topCardPalettes[index]} />
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 overflow-x-auto pb-1 no-scrollbar'>
        <div className='flex min-w-[1180px] flex-nowrap items-stretch gap-4'>
          <motion.div variants={itemVariants} className='min-w-[760px] flex-[1.55] basis-0'>
          <Card className='relative overflow-hidden rounded-none border-[#dbc4a5] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,239,225,0.98)_100%)] p-4 shadow-[0_28px_60px_rgba(31,26,23,0.10)]'>
            <div className='pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(207,168,92,0),rgba(207,168,92,0.95),rgba(207,168,92,0))]' />
            <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(233,203,148,0.28),transparent_68%)]' />
            <CardContent className='p-0'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <PanelHeader
                eyebrow='Revenue Analysis'
                title='Sales movement with tighter control'
                description='Switch the visible range without reloading the whole page.'
                icon='mdi:chart-timeline-variant'
                iconClass='bg-[#EFF6FF] text-[#2563EB]'
              />

              <div className='flex items-center gap-1 border border-[#dcc29a] bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(244,235,220,0.96)_100%)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(31,26,23,0.08)] backdrop-blur'>
                {PERIODS.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setPeriod(option.value)}
                    className={`min-w-[52px] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                      period === option.value
                        ? 'bg-[linear-gradient(180deg,#2a221d_0%,#15110f_100%)] text-[#f6e2b5] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_22px_rgba(31,26,23,0.22)]'
                        : 'text-[#7b6c5a] hover:bg-white/70 hover:text-[#1f1a17]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='mt-4 border border-[#ead8bd] bg-[linear-gradient(180deg,#fffdfa_0%,#fff6e7_100%)] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_10px_22px_rgba(31,26,23,0.04)]'>
              <div className='h-[220px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id='dashboardRevenueArea' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#FACC15' stopOpacity={0.42} />
                        <stop offset='100%' stopColor='#FACC15' stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#E5E7EB' />
                    <XAxis
                      dataKey='name'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#FACC15', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.10)',
                      }}
                      formatter={(value) => [currencyFormatter.format(value), 'Revenue']}
                    />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke='#FACC15'
                      strokeWidth={2.5}
                      fill='url(#dashboardRevenueArea)'
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className='mt-3 overflow-x-auto pb-1 no-scrollbar'>
              <div className='flex min-w-[760px] flex-nowrap gap-3'>
                {chartMetrics.map((metric) => (
                  <div key={metric.key} className='min-w-[175px] flex-1 basis-0'>
                    <MiniMetric
                      {...metric}
                    />
                  </div>
                ))}
              </div>
            </div>
            </CardContent>
          </Card>
          </motion.div>

            <motion.div variants={itemVariants} className='min-w-[360px] flex-[0.78] basis-0'>
              <Card className='relative overflow-hidden rounded-none border-[#dbc4a5] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,239,225,0.98)_100%)] p-4 shadow-[0_28px_60px_rgba(31,26,23,0.10)]'>
                <div className='pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(207,168,92,0),rgba(207,168,92,0.95),rgba(207,168,92,0))]' />
                <div className='pointer-events-none absolute -right-8 top-6 h-28 w-28 rounded-full bg-[#f4e1b9]/45 blur-3xl' />
                <CardContent className='p-0'>
              <PanelHeader
                eyebrow='Category Mix'
                title='Catalog weight by segment'
                description='Keep the most important group visible at a glance.'
                icon='mdi:chart-donut'
                iconClass='bg-[#FFF8DB] text-[#D69E00]'
              />

              <div className='mt-4 border border-[#ead8bd] bg-[linear-gradient(180deg,#fffdf9_0%,#fff6e7_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_10px_22px_rgba(31,26,23,0.04)]'>
                <div className='flex items-center gap-3'>
                  <div className='relative mx-auto h-[132px] w-[132px] shrink-0 border border-[#efe1cb] bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(250,243,233,0.92)_100%)] p-2 shadow-[0_18px_36px_rgba(31,26,23,0.08)]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx='50%'
                          cy='50%'
                          innerRadius={34}
                          outerRadius={54}
                          paddingAngle={4}
                          dataKey='value'
                          stroke='none'
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`${entry?.name || entry?._id || index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '16px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.10)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-[10px] uppercase tracking-[0.16em] text-slate-400'>Total</span>
                      <span className='mt-1 text-lg font-semibold text-slate-900'>{categoryTotal}</span>
                    </div>
                  </div>

                  <div className='grid flex-1 grid-cols-2 gap-2'>
                    {categorySummary.map((item) => (
                      <CategoryMetricCard
                        key={item.label}
                        {...item}
                        active={selectedCategoryLabel === item.label}
                        onClick={() => setSelectedCategory(item.label)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className='mt-3 border border-[#e4d1b1] bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_24px_rgba(31,26,23,0.05)]'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>Focused Category</p>
                <div className='mt-2 flex items-end justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-slate-900'>{selectedCategoryLabel || 'No category selected'}</p>
                    <p className='mt-1 text-xs text-slate-500'>Highlighted from the live category distribution.</p>
                  </div>
                  <p className='text-lg font-semibold tracking-tight text-slate-900'>{selectedCategoryValue ?? 0}</p>
                </div>
              </div>
                </CardContent>
              </Card>
            </motion.div>
        </div>
      </div>

      <motion.div variants={itemVariants} className='mt-4'>
              <Card className='rounded-none border-[#e7ddcf] bg-white/96 p-4'>
                <CardContent className='p-0'>
              <PanelHeader
                eyebrow='Recent Activities'
                title='Latest orders stream'
                description={`${recentOrders.length} latest orders from the current feed.`}
                icon='mdi:package-variant-closed'
                iconClass='bg-[#ECFDF5] text-[#059669]'
                action={
                  <div className='rounded-[20px] bg-white/95 p-1.5 shadow-[0_14px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/90 backdrop-blur'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-[16px] bg-slate-100 text-slate-500 shadow-inner'>
                      <DashboardIcon icon='mdi:dots-horizontal' size={18} />
                    </div>
                  </div>
                }
              />
              {!recentOrders.length ? (
                <div className='mt-6 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400'>
                  No recent orders found in the database.
                </div>
              ) : (
                <div className='admin-scrollbar mt-4 max-h-[342px] space-y-2.5 overflow-y-auto pr-1'>
                  {recentOrders.map((order, index) => {
                    const customer = getCustomerName(order?.address)
                    const isSelected = selectedOrderId === order?._id
                    const badgeClass =
                      index % 3 === 0
                        ? 'bg-[#FDE6DC] text-[#E78967]'
                        : index % 3 === 1
                          ? 'bg-[#D9F0FF] text-[#4EA8DE]'
                          : 'bg-[#DDF7E7] text-[#3FA46A]'

                    return (
                      <motion.button
                        key={order?._id || index}
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        type='button'
                        onClick={() => setSelectedOrderId(order?._id || null)}
                        className={`w-full px-3.5 py-3.5 text-left transition ${
                          isSelected
                            ? 'border border-[#ddccb7] bg-[#f7efe3] text-slate-900 shadow-[0_18px_42px_rgba(31,26,23,0.08)]'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className='flex items-start gap-3'>
                        <div className={`rounded-2xl p-1 shadow-sm ring-1 ${isSelected ? 'bg-white ring-[#eadfce]' : 'bg-white/90 ring-white/80'}`}>
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${badgeClass}`}>
                            <DashboardIcon icon='mdi:package-variant-closed' size={18} />
                          </div>
                        </div>

                          <div className='min-w-0 flex-1'>
                            <div className='flex items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <p className='truncate text-[13.5px] font-medium text-slate-900'>{customer}</p>
                                <p className={`mt-1 text-[10.5px] uppercase tracking-[0.16em] ${isSelected ? 'text-[#8b7761]' : 'text-slate-400'}`}>
                                  #{String(order?._id || '').slice(-8).toUpperCase()}
                                </p>
                              </div>
                              <p className='shrink-0 text-[13px] font-semibold text-slate-900'>
                                {currencyFormatter.format(Number(order?.amount) || 0)}
                              </p>
                            </div>

                            <div className='mt-3 flex items-center justify-between gap-3'>
                              <p className={`text-[11px] ${isSelected ? 'text-[#8b7761]' : 'text-slate-500'}`}>
                                {order?.date
                                  ? new Date(order.date).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${getStatusClass(order?.status)}`}>
                                {order?.status || 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
                </CardContent>
              </Card>
      </motion.div>
    </div>
  )
}

export default Dashboard
