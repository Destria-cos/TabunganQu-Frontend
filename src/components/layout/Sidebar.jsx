import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { transactionService } from '../../services/transactionService'
import { formatRupiah, formatDate } from '../../utils/helpers'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { to: '/saldo',     label: 'Saldo',     emoji: '💳' },
  { to: '/wishlist',  label: 'Wishlist',  emoji: '⭐' },
  { to: '/report',    label: 'Report',    emoji: '📊' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { logout } = useAuth()
  const [searchQuery, setSearchQuery]       = useState('')
  const [allTransactions, setAllTransactions] = useState([])
  const [hasFetched, setHasFetched]         = useState(false)
  const [isLoading, setIsLoading]           = useState(false)
  const [showDropdown, setShowDropdown]     = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchQuery.trim().length > 0 && !hasFetched) {
      setIsLoading(true)
      setHasFetched(true)
      transactionService.getTransactions()
        .then(res => setAllTransactions(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false))
    }
  }, [searchQuery, hasFetched])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = allTransactions
    .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[89] min-[901px]:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] flex-shrink-0 flex flex-col z-[90] overflow-hidden transition-transform duration-300 min-[901px]:relative min-[901px]:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0f0f1a 0%, #13111c 60%, #0d0d14 100%)',
          borderRight: '1px solid rgba(139,92,246,0.15)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-0 w-full h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-[2] flex flex-col h-full py-6">
          {/* Logo */}
          <div
            className="text-center mb-8 px-5 cursor-pointer"
            onClick={() => { navigate('/'); onClose() }}
          >
            <div className="text-[22px] font-black tracking-tight gradient-text">TabunganQu</div>
            <div className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5">Finance App</div>
          </div>

          {/* Search */}
          <div className="px-4 mb-6" ref={searchRef}>
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-transparent border-none text-white text-[13px] outline-none placeholder:text-white/30"
                />
              </div>

              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-xl shadow-2xl overflow-hidden z-20 animate-scale-in"
                  style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {isLoading ? (
                    <div className="px-4 py-3 text-[12px] text-white/40 text-center">Memuat...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(trans => (
                      <div
                        key={trans.id}
                        className="px-3 py-2.5 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => { navigate('/saldo'); setShowDropdown(false); setSearchQuery(''); onClose() }}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] text-white/40">{formatDate(trans.transaction_date)}</span>
                          <span className={`text-[12px] font-bold font-mono ${trans.type === 'pemasukan' ? 'text-emerald-400' : 'text-pink-400'}`}>
                            {trans.type === 'pemasukan' ? '+' : '-'} Rp {formatRupiah(trans.amount)}
                          </span>
                        </div>
                        <p className="text-[12px] text-white/80 truncate">{trans.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[12px] text-white/40 text-center">Tidak ada hasil 🔍</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-1 px-3">
            <div className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2">Menu</div>
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium no-underline transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(96,165,250,0.15))',
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.15)',
                  } : {}}
                >
                  <span className="text-[16px]">{item.emoji}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 mt-4 flex flex-col gap-2">
            <button
              onClick={() => { navigate('/settings'); onClose() }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-all w-full text-left"
            >
              <span className="text-[16px]">⚙️</span>
              <span>Settings</span>
            </button>
            <button
              onClick={() => { logout(); navigate('/'); onClose() }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all w-full text-left"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <span className="text-[16px]">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
