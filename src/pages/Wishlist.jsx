import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { wishlistService } from '../services/wishlistService'
import { transactionService } from '../services/transactionService'
import { DEBUG_MODE } from '../config/debugMode'
import { DUMMY_SUMMARY, DUMMY_WISHLIST } from '../data/dummyData'
import { formatRupiah, formatRupiahCompact } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'
import LoadingSpinner from '../components/ui/LoadingSpinner'

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

const inputCls = 'w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none input-glow transition-all'
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
const labelCls = 'block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5'

const CARD_GRADIENTS = [
  'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.08))',
  'linear-gradient(135deg,rgba(5,150,105,0.15),rgba(4,120,87,0.08))',
  'linear-gradient(135deg,rgba(219,39,119,0.15),rgba(190,24,93,0.08))',
  'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.08))',
  'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(37,99,235,0.08))',
]
const PROGRESS_COLORS = [
  'linear-gradient(90deg,#a78bfa,#60a5fa)',
  'linear-gradient(90deg,#34d399,#10b981)',
  'linear-gradient(90deg,#f472b6,#ec4899)',
  'linear-gradient(90deg,#fbbf24,#f59e0b)',
  'linear-gradient(90deg,#60a5fa,#3b82f6)',
]

export default function Wishlist() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [wishlists, setWishlists] = useState([])
  const [summary, setSummary] = useState({ saldo: 0 })
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', targetAmount: '', savedAmount: '' })
  const [targetDisplay, setTargetDisplay] = useState('')
  const [savedDisplay, setSavedDisplay] = useState('')

  useEffect(() => { fetchAllData() }, [])
  useEffect(() => {
    const t = setTimeout(() => { if (!loading) fetchWishlists() }, 500)
    return () => clearTimeout(t)
  }, [search])

  const fetchAllData = async () => {
    setLoading(true)
    if (DEBUG_MODE.ENABLED) {
      setTimeout(() => { setSummary({ saldo: DUMMY_SUMMARY.saldo }); setWishlists(DUMMY_WISHLIST); setLoading(false) }, 500)
      return
    }
    try {
      const [sRes, wRes] = await Promise.all([transactionService.getSummary(), wishlistService.getWishlists()])
      setSummary(sRes.data); setWishlists(wRes.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const fetchWishlists = async () => {
    try { const r = await wishlistService.getWishlists(search); setWishlists(r.data) }
    catch { toast.error('Gagal memuat wishlist') }
  }

  const openAdd = () => {
    setEditItem(null); setFormData({ name: '', targetAmount: '', savedAmount: '0' })
    setTargetDisplay(''); setSavedDisplay(''); setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditItem(item)
    setFormData({ name: item.name, targetAmount: item.target_amount.toString(), savedAmount: item.saved_amount.toString() })
    setTargetDisplay(fmtInput(item.target_amount.toString()))
    setSavedDisplay(fmtInput(item.saved_amount.toString()))
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const target = parseInt(formData.targetAmount)
    const saved = parseInt(formData.savedAmount) || 0
    if (!formData.name.trim()) return toast.error('Nama wishlist harus diisi')
    if (!target || target <= 0) return toast.error('Target nominal harus lebih dari 0')
    if (saved < 0) return toast.error('Nominal terkumpul tidak valid')
    setLoading(true)
    try {
      const data = { name: formData.name.trim(), targetAmount: target, savedAmount: saved }
      if (editItem) { await wishlistService.updateWishlist(editItem.id, data); toast.success('Wishlist diupdate ✅') }
      else { await wishlistService.createWishlist(data); toast.success('Wishlist ditambahkan 🎯') }
      setModalOpen(false); await fetchAllData()
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus wishlist ini?')) return
    setLoading(true)
    try { await wishlistService.deleteWishlist(id); toast.success('Wishlist dihapus 🗑️'); await fetchAllData() }
    catch { toast.error('Gagal menghapus') }
    finally { setLoading(false) }
  }

  const progress = (saved, target) => !target ? 0 : Math.min(100, Math.round((saved / target) * 100))

  if (loading && !modalOpen) return <LoadingSpinner />

  const totalTarget = wishlists.reduce((s, w) => s + w.target_amount, 0)
  const totalSaved  = wishlists.reduce((s, w) => s + w.saved_amount, 0)
  const overallPct  = totalTarget ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div className="text-white pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="m-0 text-[20px] font-black text-white">⭐ Wishlist Saya</h2>
          <p className="text-[12px] text-white/35 m-0 mt-0.5">Impianmu, satu langkah lebih dekat ✨</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold text-white btn-neon-purple">
          ✨ Tambah Wishlist
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl p-4 glass-dark">
          <div className="text-[11px] text-white/40 uppercase tracking-widest mb-1">💰 Saldo Tersedia</div>
          <div className="text-[20px] font-black gradient-text">{formatRupiahCompact(summary.saldo)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Rp {formatRupiah(summary.saldo)}</div>
        </div>
        <div className="rounded-2xl p-4 glass-dark">
          <div className="text-[11px] text-white/40 uppercase tracking-widest mb-1">🎯 Total Target</div>
          <div className="text-[20px] font-black text-white">{formatRupiahCompact(totalTarget)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">{wishlists.length} wishlist aktif</div>
        </div>
        <div className="rounded-2xl p-4 glass-dark">
          <div className="text-[11px] text-white/40 uppercase tracking-widest mb-1">📊 Progress Keseluruhan</div>
          <div className="text-[20px] font-black" style={{ color: overallPct >= 100 ? '#34d399' : '#a78bfa' }}>{overallPct}%</div>
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg,#a78bfa,#60a5fa)' }} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Cari wishlist..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-[13px] text-white pl-8 pr-3 py-2.5 rounded-xl outline-none input-glow"
            style={inputStyle} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlists.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
            style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
            <span className="text-[48px]">🎯</span>
            <p className="text-white/30 text-[14px]">Belum ada wishlist. Yuk buat yang pertama!</p>
            <button onClick={openAdd}
              className="px-5 py-2.5 rounded-full text-[13px] font-bold text-white btn-neon-purple">
              ✨ Buat Wishlist
            </button>
          </div>
        ) : (
          wishlists.map((item, idx) => {
            const pct = progress(item.saved_amount, item.target_amount)
            const isComplete = pct >= 100
            const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
            const progGrad = isComplete ? 'linear-gradient(90deg,#34d399,#10b981)' : PROGRESS_COLORS[idx % PROGRESS_COLORS.length]
            return (
              <div key={item.id} className="rounded-2xl p-4 flex flex-col card-hover"
                style={{ background: grad, border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Title row */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-white m-0 flex-1 mr-2 leading-snug">{item.name}</h3>
                  {isComplete && <span className="text-[20px] animate-bounce-in">🎉</span>}
                </div>

                {/* Stats */}
                <div className="space-y-1.5 text-[12px] mb-3">
                  {[
                    ['🎯 Target', item.target_amount],
                    ['💰 Terkumpul', item.saved_amount],
                    ['⏳ Sisa', Math.max(0, item.target_amount - item.saved_amount)],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex justify-between items-center">
                      <span className="text-white/40">{lbl}</span>
                      <span className="font-bold text-white/90">Rp {formatRupiah(val)}</span>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-white/30 uppercase tracking-widest">Progress</span>
                    <span className="font-bold" style={{ color: isComplete ? '#34d399' : '#a78bfa' }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: progGrad }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => openEdit(item)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? '✏️ Edit Wishlist' : '✨ Tambah Wishlist'}>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className={labelCls}>Nama Wishlist</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputCls} style={inputStyle} placeholder="Contoh: Laptop Baru 💻" required />
          </div>
          <div>
            <label className={labelCls}>Target Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/30 font-bold">Rp</span>
              <input type="text" value={targetDisplay}
                onChange={e => { const f = fmtInput(e.target.value); setTargetDisplay(f); setFormData({ ...formData, targetAmount: parseNum(f).toString() }) }}
                placeholder="0" className={`${inputCls} pl-10`} style={inputStyle} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Sudah Terkumpul</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/30 font-bold">Rp</span>
              <input type="text" value={savedDisplay}
                onChange={e => { const f = fmtInput(e.target.value); setSavedDisplay(f); setFormData({ ...formData, savedAmount: parseNum(f).toString() }) }}
                placeholder="0" className={`${inputCls} pl-10`} style={inputStyle} />
            </div>
            <p className="text-[11px] text-white/25 mt-1.5">* Kosongi jika belum ada tabungan</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white/60 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50 btn-neon-purple">
              {loading ? 'Menyimpan...' : '✅ Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  )
}
