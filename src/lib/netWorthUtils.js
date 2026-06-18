export function fmt(n) {
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))
}

export function fmtShort(n) {
  const a = Math.abs(n)
  if (a >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
  if (a >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L'
  return fmt(n)
}

export const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function getGreeting() {
  const h = new Date().getHours()
  return (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + '.'
}

export function getDateFmt() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function computeNetWorth(sources, entries) {
  const srcById = Object.fromEntries(sources.map(s => [s.id, s]))
  let assets = 0, liab = 0
  entries.forEach(en => {
    const src = srcById[en.sourceId]
    if (!src) return
    if (src.type === 'liability') liab += en.amount
    else assets += en.amount
  })
  return { assets, liab, net: assets - liab, srcById }
}

export function buildBreakdown(sources, entries, assets) {
  return sources
    .filter(s => s.type === 'asset')
    .map(src => {
      const value = entries
        .filter(en => en.sourceId === src.id)
        .reduce((a, en) => a + en.amount, 0)
      const pct = assets ? (value / assets) * 100 : 0
      return { id: src.id, name: src.name, color: src.color, value, pct, pctFmt: pct.toFixed(0) + '%' }
    })
    .filter(b => b.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function buildSourcesView(sources, entries, onDelete) {
  const totals = sources.map(src => {
    const ents = entries.filter(en => en.sourceId === src.id)
    return { src, total: ents.reduce((a, en) => a + en.amount, 0), count: ents.length }
  })
  const maxTot = Math.max(1, ...totals.map(t => t.total))
  return totals.map(t => ({
    id: t.src.id,
    name: t.src.name,
    color: t.src.color,
    totalFmt: (t.src.type === 'liability' ? '−' : '') + fmt(t.total),
    amtColor: t.src.type === 'liability' ? 'oklch(0.55 0.10 32)' : '#1d1b18',
    barPctStr: Math.max(3, (t.total / maxTot) * 100).toFixed(0) + '%',
    countFmt: t.count + (t.count === 1 ? ' entry' : ' entries'),
    tagLabel: t.src.type === 'liability' ? 'Liability' : 'Asset',
    tagColor: t.src.type === 'liability' ? 'oklch(0.52 0.11 32)' : 'oklch(0.46 0.07 155)',
    tagBg: t.src.type === 'liability' ? 'oklch(0.95 0.035 40)' : 'oklch(0.95 0.03 155)',
    onDelete: () => onDelete(t.src.id),
  }))
}

export function buildTrendSeries(history, net) {
  const series = [...history, net]
  const now = new Date()
  const labels = series.map((_, i) =>
    MONTH_LABELS[new Date(now.getFullYear(), now.getMonth() - (series.length - 1 - i), 1).getMonth()]
  )
  return { series, labels }
}

export const SOURCE_PALETTE = [
  'oklch(0.70 0.06 200)',
  'oklch(0.72 0.065 110)',
  'oklch(0.74 0.075 50)',
  'oklch(0.68 0.06 290)',
  'oklch(0.70 0.06 350)',
  'oklch(0.68 0.07 260)',
]

export const DEFAULT_SOURCES = [
  { id: 'cash', name: 'Cash & Bank', type: 'asset', color: 'oklch(0.74 0.055 155)' },
  { id: 'stocks', name: 'Stocks & Brokerage', type: 'asset', color: 'oklch(0.70 0.06 235)' },
  { id: 'vehicles', name: 'Vehicles', type: 'asset', color: 'oklch(0.77 0.08 75)' },
  { id: 'valuables', name: 'Other Valuables', type: 'asset', color: 'oklch(0.70 0.055 330)' },
  { id: 'debt', name: 'Liabilities & Debt', type: 'liability', color: 'oklch(0.64 0.09 32)' },
]

export const DEFAULT_ENTRIES = [
  { id: 'e1', sourceId: 'cash', label: 'HDFC Savings', amount: 420000 },
  { id: 'e2', sourceId: 'cash', label: 'ICICI Salary A/c', amount: 185000 },
  { id: 'e3', sourceId: 'stocks', label: 'Zerodha Equity', amount: 1250000 },
  { id: 'e4', sourceId: 'stocks', label: 'Groww Mutual Funds', amount: 680000 },
  { id: 'e5', sourceId: 'vehicles', label: 'Honda City', amount: 750000 },
  { id: 'e6', sourceId: 'valuables', label: 'Gold & Jewellery', amount: 320000 },
  { id: 'e7', sourceId: 'debt', label: 'Home Loan', amount: 1800000 },
  { id: 'e8', sourceId: 'debt', label: 'Credit Card', amount: 45000 },
]

export const DEFAULT_HISTORY = [
  1450000, 1492000, 1531000, 1508000, 1559000, 1602000,
  1624000, 1656000, 1691000, 1705000, 1717700,
]
