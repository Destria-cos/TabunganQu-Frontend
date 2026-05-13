import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatRupiah, formatRupiahCompact, getGreeting } from '../utils/helpers'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_CHART, DUMMY_WISHLIST } from '../data/dummyData'

const STAT_CARDS = [
  {
    key: 'saldo',
    label: 'Total Saldo',
    emoji: '💰',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    glow: 'rgba(124,58,237,0.4)',
    textColor: '#c4b5fd',
  },
  {
    key: 'pemasukan',
    label: 'Pemasukan',
    emoji: '📈',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glow: 'rgba(5,150,105,0.4)',
    textColor: '#6ee7b7',
  },
  {
    key: 'pengeluaran',
    label: 'Pengeluaran',
    emoji: '📉',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    glow: 'rgba(219,39,119,0.4)',
    textColor: '#fbcfe8',
  },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-[12px] font-bold text-white"
        style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        Rp {formatRupiah(payload[0].value)}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [summary, setSummary]       = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 })
  const [chartData, setChartData]   = useState({ pemasukan: [], pengeluaran: [] })
  const [wishlists, setWishlists]   = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeChart, setActiveChart]   = useState('pemasukan')

  useEffect(() => { fetchDashboardData(true) }, [selectedYear])
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(false), 30000)
    return () => clearInterval(interval)
  }, [selectedYear])

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary(DUMMY_SUMMARY)
        setChartData(DUMMY_CHART)
        setWishlists(DUMMY_WISHLIST)
        if (showLoading) setLoading(false)
      }, 500)
      return
    }
    try {
      const [summaryRes, chartRes, wishlistRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getChartData(selectedYear),
        wishlistService.getWishlists(),
      ])
      setSummary(summaryRes.data)
      setChartData(chartRes.data)
      setWishlists(wishlistRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const calculateProgress = (saved, target) => {
    if (!target) return 0
    return Math.min(100, Math.round((saved / target) * 100))
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>
  if (error)   return <div className="min-h-[60vh] flex items-center justify-center"><ErrorDisplay message={error} onRetry={fetchDashboardData} /></div>

  const chartBarData = activeChart === 'pemasukan' ? chartData.pemasukan : chartData.pengeluaran
  const chartColor   = activeChart === 'pemasukan' ? '#10b981' : '#f472b6'

  return (
    <div className="text-white pb-6 animate-fade-in">

      {/* ── Greeting ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[22px]">👋</span>
          <h2 className="m-0 text-[20px] md:text-[24px] font-black text-white">
            {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Kamu'}!</span>
          </h2>
        </div>
        <p className="text-[13px] text-white/40 m-0">Pantau keuanganmu hari ini ✨</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map(card => (
          <div
            key={card.key}
            className="relative rounded-2xl p-4 overflow-hidden card-hover cursor-pointer"
            style={{ background: card.gradient, boxShadow: `0 8px 24px ${card.glow}` }}
            onClick={() => navigate(card.key === 'saldo' ? '/saldo' : '/report')}
          >
            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20"
              style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute -right-2 -bottom-6 w-28 h-28 rounded-full opacity-10"
              style={{ background: 'rgba(255,255,255,0.3)' }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: card.textColor }}>
                  {card.label}
                </span>
                <span className="text-[20px]">{card.emoji}</span>
              </div>
              <div className="text-[22px] md:text-[26px] font-black text-white leading-none">
                {formatRupiahCompact(summary[card.key])}
              </div>
              <div className="text-[11px] mt-1 opacity-60 text-white">Rp {formatRupiah(summary[card.key])}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* Chart section */}
        <div className="rounded-2xl p-5 glass-dark">
          {/* Chart toggle */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['pemasukan', 'pengeluaran'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveChart(type)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-all ${
                    activeChart === type ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                  style={activeChart === type ? {
                    background: type === 'pemasukan'
                      ? 'linear-gradient(135deg, #059669, #047857)'
                      : 'linear-gradient(135deg, #db2777, #be185d)',
                    boxShadow: type === 'pemasukan'
                      ? '0 0 12px rgba(5,150,105,0.4)'
                      : '0 0 12px rgba(219,39,119,0.4)',
                  } : {}}
                >
                  {type === 'pemasukan' ? '📈' : '📉'} {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white/40">Tahun:</span>
              <select
                className="text-[12px] text-white px-2 py-1 rounded-lg outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartBarData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }}
                tickFormatter={v => {
                  if (v === 0) return '0'
                  if (v >= 1000000) return `${v / 1000000}jt`
                  if (v >= 1000) return `${v / 1000}k`
                  return v
                }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" fill={chartColor} radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>

          {/* Quick action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => navigate('/saldo')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-all btn-neon-green"
            >
              <span>➕</span> Tambah Transaksi
            </button>
            <button
              onClick={() => navigate('/report')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span>📊</span> Lihat Report
            </button>
          </div>
        </div>

        {/* Wishlist panel */}
        <div className="rounded-2xl p-4 glass-dark flex flex-col" style={{ minHeight: 340 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">⭐</span>
              <span className="text-[14px] font-bold text-white">Wishlist</span>
            </div>
            <button
              onClick={() => navigate('/wishlist')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              Lihat Semua →
            </button>
          </div>

          {wishlists.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <span className="text-[32px]">🎯</span>
              <p className="text-[13px] text-white/30 text-center">Belum ada wishlist nih!</p>
              <button
                onClick={() => navigate('/wishlist')}
                className="px-4 py-2 rounded-full text-[12px] font-bold text-white btn-neon-purple"
              >
                + Buat Wishlist
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
              {wishlists.slice(0, 5).map(item => {
                const progress = calculateProgress(item.saved_amount, item.target_amount)
                const isComplete = progress >= 100
                return (
                  <div
                    key={item.id}
                    className="rounded-xl p-3 card-hover cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onClick={() => navigate('/wishlist')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[13px] font-bold text-white/90 truncate flex-1 mr-2">{item.name}</span>
                      {isComplete && <span className="text-[14px]">🎉</span>}
                    </div>
                    <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                      <span>{formatRupiahCompact(item.saved_amount)}</span>
                      <span className="font-bold" style={{ color: isComplete ? '#34d399' : '#a78bfa' }}>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: isComplete
                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                            : 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
