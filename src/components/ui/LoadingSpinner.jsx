export default function LoadingSpinner({ size = 'medium' }) {
  const sz = { small: 'w-5 h-5', medium: 'w-8 h-8', large: 'w-12 h-12' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sz} rounded-full animate-spin`}
        style={{ border: '3px solid rgba(139,92,246,0.15)', borderTopColor: '#a78bfa' }} />
      <p className="text-[12px] font-medium" style={{ color: 'rgba(167,139,250,0.6)' }}>Memuat data...</p>
    </div>
  )
}
