// Dikontrol lewat environment variable:
//   .env.local      → VITE_DEBUG_MODE=true  (offline, dummy data, tanpa backend)
//   .env.production → VITE_DEBUG_MODE=false (online, pakai API real)
//
// Cara pakai:
//   npm run dev          → otomatis pakai .env.local  (DEBUG aktif)
//   npm run build        → otomatis pakai .env.production (DEBUG nonaktif)
//   npm run dev:online   → pakai backend localhost nyala (DEBUG nonaktif)

export const DEBUG_MODE = {
  ENABLED: import.meta.env.VITE_DEBUG_MODE === 'true',
};
