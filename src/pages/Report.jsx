import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { formatRupiah, formatRupiahCompact, formatDateFull, getMonthName } from '../utils/helpers'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_ALL_TRANSACTIONS, DUMMY_CHART } from '../data/dummyData'

const PIE_COLORS = ['#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#fb923c']

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-[12px] font-bold text-white"
      style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      {label !== undefined && <p className="text-white/50 mb-1 text-[11px]">Tgl {label}</p>}
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>
          {e.name === 'pemasukan' ? '📈' : '📉'} Rp {formatRupiah(e.value)}
        </p>
      ))}
    </div>
  )
}

export default function Report() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0, total_transactions_pemasukan: 0, total_transactions_pengeluaran: 0 })
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])
  const [yearlyData, setYearlyData] = useState(null)

  useEffect(() => { fetchReport() }, [selectedMonth])

  const fetchReport = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => {
        setSummary({ ...DUMMY_SUMMARY, total_transactions_pemasukan: 2, total_transactions_pengeluaran: 2 })
        setTransactions(DUMMY_ALL_TRANSACTIONS)
        setChartData([
          { day: 1, pemasukan: 5000000, pengeluaran: 0 },
          { day: 5, pemasukan: 0, pengeluaran: 1500000 },
          { day: 10, pemasukan: 10000000, pengeluaran: 0 },
          { day: 15, pemasukan: 0, pengeluaran: 3000000 },
        ])
        setYearlyData(Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][i],
          pemasukan: i === parseInt(selectedMonth.split('-')[1]) - 1 ? 15000000 : 5000000,
          pengeluaran: i === parseInt(selectedMonth.split('-')[1]) - 1 ? 4500000 : 2000000,
          isCurrentMonth: i + 1 === parseInt(selectedMonth.split('-')[1]),
        })))
        setLoading(false)
      }, 500)
      return
    }
    try {
      const summaryRes = await transactionService.getSummary(selectedMonth)
      setSummary(summaryRes.data)
      const [y, m] = selectedMonth.split('-')
      const endDay = new Date(y, m, 0).getDate()
      const txRes = await transactionService.getTransactions({ startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-${endDay}` })
      const sorted = txRes.data.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      setTransactions(sorted)
      const dailyMap = new Map()
      sorted.forEach(t => {
        const day = new Date(t.transaction_date).getDate()
        if (!dailyMap.has(day)) dailyMap.set(day, { pemasukan: 0, pengeluaran: 0 })
        const cur = dailyMap.get(day)
        if (t.type === 'pemasukan') cur.pemasukan += t.amount; else cur.pengeluaran += t.amount
      })
      setChartData(Array.from(dailyMap.entries()).sort((a, b) => a[0] - b[0]).map(([day, d]) => ({ day, ...d })))
      const yrRes = await transactionService.getTransactions({ startDate: `${y}-01-01`, endDate: `${y}-12-31` })
      const mMap = new Map()
      yrRes.data.forEach(t => {
        const mo = new Date(t.transaction_date).getMonth() + 1
        if (!mMap.has(mo)) mMap.set(mo, { pemasukan: 0, pengeluaran: 0 })
        const cur = mMap.get(mo)
        if (t.type === 'pemasukan') cur.pemasukan += t.amount; else cur.pengeluaran += t.amount
      })
      setYearlyData(Array.from({ length: 12 }, (_, i) => {
        const d = mMap.get(i + 1) || { pemasukan: 0, pengeluaran: 0 }
        return { month: getMonthName(i), ...d, isCurrentMonth: i + 1 === parseInt(m) }
      }))
    } catch { toast.error('Gagal memuat laporan') }
    finally { setLoading(false) }
  }

  const getCategoryData = () => {
    const cats = new Map()
    transactions.forEach(t => {
      if (t.type === 'pengeluaran') cats.set(t.description, (cats.get(t.description) || 0) + t.amount)
    })
    return Array.from(cats.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const [y, m] = selectedMonth.split('-')
      const mName = getMonthName(parseInt(m) - 1)
      doc.setFontSize(18); doc.text(`Laporan Keuangan ${mName} ${y}`, 14, 20)
      doc.setFontSize(10); doc.setTextColor(100)
      doc.text(`${user?.name || '-'} | ${user?.email || '-'} | ${new Date().toLocaleDateString('id-ID')}`, 14, 28)
      autoTable(doc, {
        startY: 34,
        head: [['Deskripsi', 'Nilai']],
        body: [
          ['Total Pemasukan', `Rp ${formatRupiah(summary.pemasukan)}`],
          ['Total Pengeluaran', `Rp ${formatRupiah(summary.pengeluaran)}`],
          ['Saldo Akhir', `Rp ${formatRupiah(summary.saldo)}`],
          ['Transaksi Pemasukan', summary.total_transactions_pemasukan.toString()],
          ['Transaksi Pengeluaran', summary.total_transactions_pengeluaran.toString()],
        ],
        theme: 'grid', headStyles: { fillColor: [124, 58, 237] },
      })
      if (transactions.length > 0) {
        autoTable(doc, {
          startY: (doc.lastAutoTable?.finalY || 60) + 8,
          head: [['Tanggal', 'Keterangan', 'Tipe', 'Nominal']],
          body: transactions.map(t => [formatDateFull(t.transaction_date), t.description, t.type, `Rp ${formatRupiah(t.amount)}`]),
          theme: 'grid', headStyles: { fillColor: [5, 150, 105] },
        })
      }
      doc.save(`Laporan_${mName}_${y}.pdf`)
      toast.success('PDF berhasil diexport! 📄')
    } catch { toast.error('Gagal export PDF') }
  }

  const exportToExcel = () => {
    try {
      const [y, m] = selectedMonth.split('-')
      const mName = getMonthName(parseInt(m) - 1)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        [`Laporan ${mName} ${y}`], [],
        ['Pemasukan', summary.pemasukan], ['Pengeluaran', summary.pengeluaran], ['Saldo', summary.saldo],
      ]), 'Ringkasan')
      if (transactions.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
          ['Tanggal', 'Keterangan', 'Tipe', 'Nominal'],
          ...transactions.map(t => [formatDateFull(t.transaction_date), t.description, t.type, t.amount]),
        ]), 'Transaksi')
      }
      saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Laporan_${mName}_${y}.xlsx`)
      toast.success('Excel berhasil diexport! 📊')
    } catch { toast.error('Gagal export Excel') }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>

  const [y, m] = selectedMonth.split('-')
  const mName = getMonthName(parseInt(m) - 1)
  const categoryData = getCategoryData()
  const avgOut = summary.total_transactions_pengeluaran > 0
    ? Math.round(summary.pengeluaran / summary.total_transactions_pengeluaran) : 0

  const STAT_CARDS = [
    { label: 'Saldo Akhir', val: summary.saldo, emoji: '💰', grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)', glow: 'rgba(124,58,237,0.4)' },
    { label: 'Pemasukan', val: summary.pemasukan, sub: `${summary.total_transactions_pemasukan} transaksi`, emoji: '📈', grad: 'linear-gradient(135deg,#059669,#047857)', glow: 'rgba(5,150,105,0.4)' },
    { label: 'Pengeluaran', val: summary.pengeluaran, sub: `${summary.total_transactions_pengeluaran} transaksi`, emoji: '📉', grad: 'linear-gradient(135deg,#db2777,#be185d)', glow: 'rgba(219,39,119,0.4)' },
    { label: 'Rata-rata Keluar', val: avgOut, sub: 'per transaksi', emoji: '📊', grad: 'linear-gradient(135deg,#d97706,#b45309)', glow: 'rgba(217,119,6,0.4)' },
  ]

  return (
    <div className="text-white pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
        <div>
          <h2 className="m-0 text-[20px] font-black text-white">📊 Laporan Bulanan</h2>
          <p className="text-[12px] text-white/35 m-0 mt-0.5">Analisis keuangan {mName} {y}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Export buttons */}
          <button onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold text-white transition-all btn-neon-pink">
            📄 Export PDF
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold text-white transition-all btn-neon-green">
            📊 Export Excel
          </button>

          {/* Month picker */}
          <div className="relative">
            <button onClick={() => { setShowPicker(!showPicker); setPickerYear(parseInt(y)) }}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-bold text-white transition-all"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              📅 {mName} {y}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showPicker && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 rounded-2xl shadow-2xl p-4 w-[260px] animate-scale-in"
                style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setPickerYear(p => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
                    ‹
                  </button>
                  <span className="text-[13px] font-bold text-white">{pickerYear}</span>
                  <button onClick={() => setPickerYear(p => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((mo, i) => {
                    const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`
                    const isSel = val === selectedMonth
                    return (
                      <button key={i} onClick={() => { setSelectedMonth(val); setShowPicker(false) }}
                        className="py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                        style={isSel
                          ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }
                          : { color: 'rgba(255,255,255,0.5)' }}>
                        {mo}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => { const n = new Date(); setSelectedMonth(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`); setShowPicker(false) }}
                  className="mt-3 w-full text-center text-[11px] font-semibold py-1.5 rounded-xl transition-all"
                  style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.1)' }}>
                  Bulan ini
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="relative rounded-2xl p-3.5 overflow-hidden card-hover"
            style={{ background: c.grad, boxShadow: `0 6px 20px ${c.glow}` }}>
            <div className="absolute -right-2 -top-2 w-14 h-14 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{c.label}</span>
                <span className="text-[16px]">{c.emoji}</span>
              </div>
              <div className="text-[16px] md:text-[18px] font-black text-white">{formatRupiahCompact(c.val)}</div>
              {c.sub && <div className="text-[10px] text-white/50 mt-0.5">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="rounded-2xl p-4 md:p-5 mb-4 glass-dark">
        <h3 className="text-[14px] font-bold text-white mb-4">📅 Grafik Harian — {mName} {y}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : v >= 1000 ? `${v/1000}k` : v} />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="pemasukan" fill="#34d399" radius={[4,4,0,0]} barSize={14} name="pemasukan" />
            <Bar dataKey="pengeluaran" fill="#f472b6" radius={[4,4,0,0]} barSize={14} name="pengeluaran" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#34d399' }} /> Pemasukan
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#f472b6' }} /> Pengeluaran
          </div>
        </div>
      </div>

      {/* Yearly chart */}
      {yearlyData && (
        <div className="rounded-2xl p-4 md:p-5 mb-4 glass-dark">
          <h3 className="text-[14px] font-bold text-white mb-4">📆 Perbandingan Bulanan — {y}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : v >= 1000 ? `${v/1000}k` : v} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="pemasukan" fill="#34d399" radius={[4,4,0,0]} barSize={12} name="pemasukan" />
              <Bar dataKey="pengeluaran" fill="#f472b6" radius={[4,4,0,0]} barSize={12} name="pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom grid: pie + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="rounded-2xl p-4 md:p-5 glass-dark">
          <h3 className="text-[14px] font-bold text-white mb-4">🍩 Kategori Pengeluaran</h3>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-[32px]">🫙</span>
              <p className="text-white/30 text-[13px]">Belum ada pengeluaran bulan ini</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `Rp ${formatRupiah(v)}`} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-white/70 truncate max-w-[140px]">{cat.name}</span>
                    </div>
                    <span className="font-bold font-mono text-white/90">Rp {formatRupiah(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Transaction list */}
        <div className="rounded-2xl p-4 md:p-5 glass-dark flex flex-col">
          <h3 className="text-[14px] font-bold text-white mb-4">🧾 Detail Transaksi</h3>
          {transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-[32px]">🫙</span>
              <p className="text-white/30 text-[13px]">Belum ada transaksi bulan ini</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-[12px] text-white/80 truncate">{t.description}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{formatDateFull(t.transaction_date)}</p>
                  </div>
                  <span className="text-[12px] font-bold font-mono shrink-0"
                    style={{ color: t.type === 'pemasukan' ? '#34d399' : '#f472b6' }}>
                    {t.type === 'pemasukan' ? '+' : '-'} Rp {formatRupiah(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
