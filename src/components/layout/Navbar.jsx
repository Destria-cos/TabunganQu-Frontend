import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const PAGE_META = {
  '/dashboard': { label: 'Dashboard', emoji: '🏠' },
  '/saldo':     { label: 'Saldo',     emoji: '💳' },
  '/wishlist':  { label: 'Wishlist',  emoji: '⭐' },
  '/report':    { label: 'Report',    emoji: '📊' },
  '/settings':  { label: 'Settings',  emoji: '⚙️' },
}

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const meta = PAGE_META[location.pathname] || { label: 'TabunganQu', emoji: '💰' }

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between w-full max-w-[1400px] mx-auto py-3 px-4 md:px-6"
      style={{
        background: 'rgba(13,13,20,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all min-[901px]:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="2" y1="5" x2="16" y2="5"/>
            <line x1="2" y1="9" x2="16" y2="9"/>
            <line x1="2" y1="13" x2="16" y2="13"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[18px]">{meta.emoji}</span>
          <h1 className="m-0 text-white font-bold text-[18px] md:text-[20px] tracking-tight">{meta.label}</h1>
        </div>
      </div>

      {/* Right: quick actions + avatar */}
      <div className="flex items-center gap-2">
        {/* Quick nav pills — desktop only */}
        <div className="hidden md:flex items-center gap-1 mr-2">
          {Object.entries(PAGE_META).map(([path, m]) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                location.pathname === path
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
              style={location.pathname === path ? {
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(96,165,250,0.2))',
                border: '1px solid rgba(139,92,246,0.3)',
              } : {}}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:bg-white/5"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-violet-500/40">
              <img
                src={user?.avatar
                  ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
                    ? user.avatar
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`)
                  : '/default-avatar.png'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden md:block text-[13px] text-white/70 font-medium max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 w-[220px] rounded-2xl shadow-2xl overflow-hidden z-[100] animate-scale-in"
              style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              {/* User info */}
              <div className="flex items-center gap-3 p-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/30">
                  <img
                    src={user?.avatar
                      ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
                        ? user.avatar
                        : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`)
                      : '/default-avatar.png'}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{user?.name}</div>
                  <div className="text-[11px] text-white/40 truncate">{user?.email}</div>
                </div>
              </div>

              <div className="p-2">
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                >
                  <span>⚙️</span> Pengaturan
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] font-semibold transition-all mt-1"
                  style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)' }}
                  onClick={() => { logout(); navigate('/') }}
                >
                  <span>🚪</span> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
