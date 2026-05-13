import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { transactionService } from '../services/transactionService'
import { wishlistService } from '../services/wishlistService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_PEMASUKAN, DUMMY_PENGELUARAN, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah, formatRupiahCompact, formatDate, getTodayISO } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ── helpers ── */
const fmtInput = (v) => {
  if (!v) return ''
  const n = v.toString().replace(/[^,\d]/g, '')
  const s = n.split(',')
  let sisa = s[0].length % 3
  let r = s[0].substr(0, sisa)
  const ribuan = s[0].substr(sisa).match(/\d{3}/gi)
  if (ribuan) r += (sisa ? '.' : '') + ribuan.join('.')
  return s[1] !== undefined ? r + ',' + s[1] : r
}
const parseNum = (s) => parseInt((s || '').replace(/[^,\d]/g, '')) || 0

const getMonthOptions = () => {
  const opts = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
    opts.push({ value: `${y}-${m}`, label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d) })
  }
  return opts
}
const sortData = (data, cfg) => {
  if (!cfg.column) return data
  return [...data].sort((a, b) => {
    let av = a[cfg.column], bv = b[cfg.column]
    if (cfg.column === 'transaction_date') { av = new Date(av); bv = new Date(bv) }
    if (cfg.column === 'amount') { av = Number(av); bv = Number(bv) }
    if (av < bv) return cfg.direction === 'asc' ? -1 : 1
    if (av > bv) return cfg.direction === 'asc' ? 1 : -1
    return 0
  })
}
const filterData = (data, q) => !q ? data : data.filter(i => i.description.toLowerCase().includes(q.toLowerCase()))
const paginate = (data, page, rpp) => data.slice((page - 1) * rpp, page * rpp)

/* ── input style ── */
const inputCls = 'w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none input-glow transition-all'
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
const labelCls = 'block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5'

/* ── SortTh ── */
const SortTh = ({ label, col, cfg, setCfg }) => {
  const active = cfg.column === col
  return (
    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-white/60 transition-colors"
      onClick={() => setCfg({ column: col, direction: active && cfg.direction === 'asc' ? 'desc' : 'asc' })}>
      {label} {active && <span className="text-violet-400">{cfg.direction === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )
}

/* ── TableSection ── */
const TableSection = ({ data, type, selectedMonth, setMonth, page, setPage, sortConfig, setSortConfig,
  search, setSearch, rowsPerPage, setRowsPerPage, onAddModal, onEditModal, onDelete }) => {
  const filtered = filterData(data, search)
  const sorted = sortData(filtered, sortConfig)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))
  const rows = paginate(sorted, page, rowsPerPage)
  const isIncome = type === 'pemasukan'
  const accentColor = isIncome ? '#34d399' : '#f472b6'
  const badgeStyle = isIncome
    ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
    : { background: 'rgba(244,114,182,0.1)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.2)' }

  return (
    <div className="rounded-2xl p-4 md:p-5 mt-5 glass-dark">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">{isIncome ? '📈' : '📉'}</span>
          <span className="text-[15px] font-bold text-white capitalize">{type}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={badgeStyle}>{total} data</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onAddModal(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white transition-all"
            style={isIncome
              ? { background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 0 14px rgba(5,150,105,0.35)' }
              : { background: 'linear-gradient(135deg,#db2777,#be185d)', boxShadow: '0 0 14px rgba(219,39,119,0.35)' }}>
            ➕ Tambah
          </button>
          <select value={selectedMonth} onChange={e => setMonth(e.target.value)}
            className="text-[12px] text-white px-2.5 py-1.5 rounded-xl outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full md:w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder={`Cari ${type}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-[12px] text-white pl-8 pr-3 py-2 rounded-xl outline-none input-glow"
            style={inputStyle} />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.length === 0
          ? <div className="text-center py-10 text-white/25 text-[13px]">Belum ada data {type} 🫙</div>
          : rows.map(item => (
            <div key={item.id} className="rounded-xl p-3.5 card-hover"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-white/35">{formatDate(item.transaction_date)}</span>
                <span className="text-[13px] font-bold font-mono" style={{ color: accentColor }}>
                  {isIncome ? '+' : '-'} Rp {formatRupiah(item.amount)}
                </span>
              </div>
              <p className="text-[13px] text-white/80 mb-2.5 leading-snug">{item.description}</p>
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button onClick={() => onEditModal(type, item)}
                  className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                  style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}>✏️ Edit</button>
                <button onClick={() => onDelete(type, item.id)}
                  className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                  style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>🗑️ Hapus</button>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-white text-[13px]">
          <thead style={{ background: 'rgba(255,255,255,0.04)' }}>
            <tr>
              <SortTh label="Tanggal" col="transaction_date" cfg={sortConfig} setCfg={setSortConfig} />
              <SortTh label="Nominal" col="amount" cfg={sortConfig} setCfg={setSortConfig} />
              <SortTh label="Keterangan" col="description" cfg={sortConfig} setCfg={setSortConfig} />
              <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan="4" className="text-center py-10 text-white/25">Belum ada data {type} 🫙</td></tr>
              : rows.map((item, idx) => (
                <tr key={item.id} className="border-t border-white/5 hover:bg-white/3 transition-colors"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="px-3 py-2.5 text-white/50">{formatDate(item.transaction_date)}</td>
                  <td className="px-3 py-2.5 font-bold font-mono" style={{ color: accentColor }}>
                    {isIncome ? '+' : '-'} Rp {formatRupiah(item.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-white/80">{item.description}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEditModal(type, item)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}>Edit</button>
                      <button onClick={() => onDelete(type, item.id)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30">Per hal:</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="text-[11px] text-white px-2 py-1 rounded-lg outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {[['«', 1], ['‹', page - 1]].map(([lbl, target]) => (
              <button key={lbl} onClick={() => setPage(target)} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[12px] disabled:opacity-30 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}>{lbl}</button>
            ))}
            <span className="text-[11px] text-white/40 px-2">{page} / {totalPages}</span>
            {[['›', page + 1], ['»', totalPages]].map(([lbl, target]) => (
              <button key={lbl} onClick={() => setPage(target)} disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[12px] disabled:opacity-30 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}>{lbl}</button>
            ))}
          </div>
          <div className="text-[11px] text-white/30">
            {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, total)} dari {total}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════ */
export default function Saldo() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pemasukan, setPemasukan] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [summary, setSummary] = useState({ saldo: 0, pemasukan: 0, pengeluaran: 0 })
  const [wishlists, setWishlists] = useState([])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [pemasukanMonth, setPemasukanMonth] = useState(currentMonth)
  const [pengeluaranMonth, setPengeluaranMonth] = useState(currentMonth)
  const [pemasukanPage, setPemasukanPage] = useState(1)
  const [pengeluaranPage, setPengeluaranPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [pemasukanSort, setPemasukanSort] = useState({ column: 'transaction_date', direction: 'desc' })
  const [pengeluaranSort, setPengeluaranSort] = useState({ column: 'transaction_date', direction: 'desc' })
  const [searchPemasukan, setSearchPemasukan] = useState('')
  const [searchPengeluaran, setSearchPengeluaran] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('pemasukan')
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
  const [amountDisplay, setAmountDisplay] = useState('')

  useEffect(() => { setPemasukanPage(1) }, [pemasukanMonth, searchPemasukan])
  useEffect(() => { setPengeluaranPage(1) }, [pengeluaranMonth, searchPengeluaran])
  useEffect(() => { fetchAllData() }, [])
  useEffect(() => { if (!loading) fetchTransactions() }, [pemasukanMonth, pengeluaranMonth])

  const fetchAllData = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => { setSummary(DUMMY_SUMMARY); setPemasukan(DUMMY_PEMASUKAN); setPengeluaran(DUMMY_PENGELUARAN); setWishlists(DUMMY_WISHLIST); setLoading(false) }, 500)
      return
    }
    try {
      const [sRes, pRes, eRes, wRes] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth }),
        wishlistService.getWishlists(),
      ])
      setSummary(sRes.data); setPemasukan(pRes.data); setPengeluaran(eRes.data); setWishlists(wRes.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const fetchTransactions = async () => {
    if (DEBUG_MODE.ENABLED) return
    try {
      const [pRes, eRes] = await Promise.all([
        transactionService.getTransactions({ type: 'pemasukan', month: pemasukanMonth }),
        transactionService.getTransactions({ type: 'pengeluaran', month: pengeluaranMonth }),
      ])
      setPemasukan(pRes.data); setPengeluaran(eRes.data)
    } catch { toast.error('Gagal memuat transaksi') }
  }

  const openAddModal = (type) => {
    setModalType(type); setEditItem(null)
    setFormData({ date: getTodayISO(), amount: '', description: '', wishlistId: '' })
    setAmountDisplay(''); setModalOpen(true)
  }
  const openEditModal = (type, item) => {
    setModalType(type); setEditItem(item)
    setFormData({ date: item.transaction_date, amount: item.amount.toString(), description: item.description, wishlistId: '' })
    setAmountDisplay(fmtInput(item.amount.toString())); setModalOpen(true)
  }
  const handleAmountChange = (e) => {
    const fmt = fmtInput(e.target.value)
    setAmountDisplay(fmt); setFormData({ ...formData, amount: parseNum(fmt).toString() })
  }

  const updateWishlist = async (wid, amount) => {
    if (!wid) return null
    const w = wishlists.find(x => x.id === parseInt(wid))
    if (!w) return null
    const newSaved = w.saved_amount + amount
    await wishlistService.updateWishlist(wid, { name: w.name, targetAmount: w.target_amount, savedAmount: newSaved })
    return { name: w.name, oldAmount: w.saved_amount, newAmount: newSaved }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseInt(formData.amount)
    if (!amount || amount <= 0) return toast.error('Nominal harus lebih dari 0')
    if (!formData.description.trim()) return toast.error('Keterangan harus diisi')
    if (modalType === 'pengeluaran' && !editItem && amount > summary.saldo) return toast.error('Saldo tidak cukup!')
    setLoading(true)
    try {
      const data = { type: modalType, amount, description: formData.description.trim(), transactionDate: formData.date }
      if (editItem) {
        await transactionService.updateTransaction(editItem.id, data)
        toast.success(`${modalType} berhasil diupdate ✅`)
      } else {
        await transactionService.createTransaction(data)
        toast.success(`${modalType} berhasil ditambahkan ✅`)
        if (formData.wishlistId) {
          try {
            const r = await updateWishlist(formData.wishlistId, amount)
            if (r) toast.success(`Wishlist "${r.name}" terupdate 🎯`)
          } catch { toast.error('Gagal update wishlist') }
        }
      }
      setModalOpen(false); await fetchAllData()
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return
    setLoading(true)
    try { await transactionService.deleteTransaction(id); toast.success('Transaksi dihapus 🗑️'); await fetchAllData() }
    catch { toast.error('Gagal menghapus') }
    finally { setLoading(false) }
  }

  if (loading && !modalOpen) return <LoadingSpinner />

  const CARDS = [
    { label: 'Total Saldo', val: summary.saldo, emoji: '💰', grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)', glow: 'rgba(124,58,237,0.4)' },
    { label: 'Pemasukan', val: summary.pemasukan, emoji: '📈', grad: 'linear-gradient(135deg,#059669,#047857)', glow: 'rgba(5,150,105,0.4)' },
    { label: 'Pengeluaran', val: summary.pengeluaran, emoji: '📉', grad: 'linear-gradient(135deg,#db2777,#be185d)', glow: 'rgba(219,39,119,0.4)' },
  ]

  return (
    <div className="text-white pb-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <h2 className="m-0 text-[20px] font-black text-white">💳 Saldo & Transaksi</h2>
        <p className="text-[12px] text-white/35 m-0 mt-0.5">Kelola pemasukan & pengeluaranmu</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {CARDS.map(c => (
          <div key={c.label} className="relative rounded-2xl p-4 overflow-hidden card-hover"
            style={{ background: c.grad, boxShadow: `0 8px 24px ${c.glow}` }}>
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{c.label}</span>
                <span className="text-[18px]">{c.emoji}</span>
              </div>
              <div className="text-[20px] font-black text-white">{formatRupiahCompact(c.val)}</div>
              <div className="text-[10px] text-white/50 mt-0.5">Rp {formatRupiah(c.val)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2 mb-2 flex-wrap">
        <button onClick={() => openAddModal('pemasukan')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white btn-neon-green">
          ➕ Tambah Pemasukan
        </button>
        <button onClick={() => openAddModal('pengeluaran')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white btn-neon-pink">
          ➖ Tambah Pengeluaran
        </button>
      </div>

      {/* Tables */}
      <TableSection data={pemasukan} type="pemasukan" selectedMonth={pemasukanMonth} setMonth={setPemasukanMonth}
        page={pemasukanPage} setPage={setPemasukanPage} sortConfig={pemasukanSort} setSortConfig={setPemasukanSort}
        search={searchPemasukan} setSearch={setSearchPemasukan} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
        onAddModal={openAddModal} onEditModal={openEditModal} onDelete={handleDelete} />

      <TableSection data={pengeluaran} type="pengeluaran" selectedMonth={pengeluaranMonth} setMonth={setPengeluaranMonth}
        page={pengeluaranPage} setPage={setPengeluaranPage} sortConfig={pengeluaranSort} setSortConfig={setPengeluaranSort}
        search={searchPengeluaran} setSearch={setSearchPengeluaran} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
        onAddModal={openAddModal} onEditModal={openEditModal} onDelete={handleDelete} />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={`${modalType === 'pemasukan' ? '📈' : '📉'} ${editItem ? 'Edit' : 'Tambah'} ${modalType}`}>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className={labelCls}>Tanggal</label>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className={labelCls}>Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/30 font-bold">Rp</span>
              <input type="text" value={amountDisplay} onChange={handleAmountChange} placeholder="0"
                className={`${inputCls} pl-10`} style={inputStyle} required />
            </div>
          </div>
          {!editItem && wishlists.length > 0 && (
            <div>
              <label className={labelCls}>Hubungkan ke Wishlist (opsional)</label>
              <select value={formData.wishlistId} onChange={e => setFormData({ ...formData, wishlistId: e.target.value })}
                className={inputCls} style={inputStyle}>
                <option value="">-- Pilih Wishlist --</option>
                {wishlists.map(w => <option key={w.id} value={w.id}>{w.name} ({formatRupiahCompact(w.saved_amount)} / {formatRupiahCompact(w.target_amount)})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Keterangan</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className={inputCls} style={inputStyle} rows="3" placeholder="Contoh: Nabung buat Laptop 💻" required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white/60 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50 transition-all btn-neon-purple">
              {loading ? 'Menyimpan...' : '✅ Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}
