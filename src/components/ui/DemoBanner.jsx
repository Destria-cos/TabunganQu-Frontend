import { DEBUG_MODE } from '../../config/debugMode'

export default function DemoBanner() {
  if (!DEBUG_MODE.ENABLED) return null

  return (
    <div
      className="w-full text-center text-[11px] font-bold py-1.5 px-4 tracking-wide"
      style={{
        background: 'linear-gradient(90deg, #7c3aed, #db2777, #7c3aed)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s linear infinite',
        color: '#fff',
      }}
    >
      🎭 DEMO MODE — Data dummy, tidak terhubung ke server
    </div>
  )
}
