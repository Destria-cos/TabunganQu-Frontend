export default function Footer() {
  return (
    <footer className="mt-16 px-0 pb-8">
      <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <div className="text-[15px] font-black gradient-text mb-1">TabunganQu 💜</div>
          <div className="text-[11px] text-white/25">© 2026 TabunganQu Financial Technologies Inc.</div>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {['Privacy Policy', 'Terms of Use', 'Help Center'].map(link => (
            <a
              key={link}
              href="#"
              className="px-3 py-1 rounded-full text-[11px] text-white/40 hover:text-white/70 transition-colors no-underline"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] text-white/20 uppercase tracking-widest">Not a bank.</div>
          <div className="w-1 h-1 rounded-full bg-violet-500/40" />
          <div className="text-[10px] text-white/20 uppercase tracking-widest">Secure & Encrypted.</div>
        </div>
      </div>
    </footer>
  )
}
