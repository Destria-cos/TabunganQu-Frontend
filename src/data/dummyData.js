import { getTodayISO } from '../utils/helpers';

// ─── Dummy User ───────────────────────────────────────────────────────────────
export const DUMMY_USER = {
  id: 999,
  name: 'Demo User',
  email: 'demo@tabunganqu.app',
  avatar: null,
};

// ─── Summary ──────────────────────────────────────────────────────────────────
export const DUMMY_SUMMARY = {
  pemasukan:   15_000_000,
  pengeluaran:  4_500_000,
  saldo:       10_500_000,
  total_transactions_pemasukan:  2,
  total_transactions_pengeluaran: 2,
};

// ─── Chart (12 bulan) ─────────────────────────────────────────────────────────
export const DUMMY_CHART = {
  pemasukan: [
    { month: 'Jan', amount: 4_000_000 },
    { month: 'Feb', amount: 5_500_000 },
    { month: 'Mar', amount: 3_000_000 },
    { month: 'Apr', amount: 7_000_000 },
    { month: 'Mei', amount: 6_000_000 },
    { month: 'Jun', amount: 8_000_000 },
    { month: 'Jul', amount: 5_000_000 },
    { month: 'Agu', amount: 9_000_000 },
    { month: 'Sep', amount: 4_500_000 },
    { month: 'Okt', amount: 6_500_000 },
    { month: 'Nov', amount: 7_500_000 },
    { month: 'Des', amount: 15_000_000 },
  ],
  pengeluaran: [
    { month: 'Jan', amount: 1_500_000 },
    { month: 'Feb', amount: 2_000_000 },
    { month: 'Mar', amount: 1_000_000 },
    { month: 'Apr', amount: 3_000_000 },
    { month: 'Mei', amount: 2_500_000 },
    { month: 'Jun', amount: 1_800_000 },
    { month: 'Jul', amount: 2_200_000 },
    { month: 'Agu', amount: 3_500_000 },
    { month: 'Sep', amount: 1_200_000 },
    { month: 'Okt', amount: 2_800_000 },
    { month: 'Nov', amount: 3_200_000 },
    { month: 'Des', amount: 4_500_000 },
  ],
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const DUMMY_WISHLIST = [
  { id: 1, name: 'MacBook Pro M3 💻',  target_amount: 25_000_000, saved_amount: 10_000_000 },
  { id: 2, name: 'Liburan Jepang ✈️',  target_amount: 15_000_000, saved_amount:  5_000_000 },
  { id: 3, name: 'Dana Darurat 🛡️',    target_amount: 50_000_000, saved_amount: 10_500_000 },
  { id: 4, name: 'Motor Baru 🏍️',      target_amount: 20_000_000, saved_amount: 20_000_000 },
  { id: 5, name: 'Kamera Mirrorless 📷', target_amount: 8_000_000, saved_amount:  2_000_000 },
];

// ─── Transactions ─────────────────────────────────────────────────────────────
export const DUMMY_PEMASUKAN = [
  { id: 1, transaction_date: getTodayISO(),  amount:  5_000_000, description: 'Gaji Bulanan',   type: 'pemasukan' },
  { id: 2, transaction_date: '2026-05-01',   amount: 10_000_000, description: 'Bonus Project',  type: 'pemasukan' },
];

export const DUMMY_PENGELUARAN = [
  { id: 3, transaction_date: getTodayISO(),  amount: 1_500_000, description: 'Belanja Bulanan', type: 'pengeluaran' },
  { id: 4, transaction_date: '2026-05-05',   amount: 3_000_000, description: 'Bayar Kos',       type: 'pengeluaran' },
];

export const DUMMY_ALL_TRANSACTIONS = [
  ...DUMMY_PEMASUKAN,
  ...DUMMY_PENGELUARAN,
];
