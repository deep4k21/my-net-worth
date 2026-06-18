export function DonutChart({ breakdown }) {
  const C = 2 * Math.PI * 52

  const segments = breakdown.reduce((acc, b) => {
    const len = (b.pct / 100) * C
    acc.els.push(
      <circle
        key={b.id}
        cx={60} cy={60} r={52}
        fill="none"
        stroke={b.color}
        strokeWidth={15}
        strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`}
        strokeDashoffset={(-acc.offset).toFixed(2)}
      />
    )
    return { els: acc.els, offset: acc.offset + len }
  }, { els: [], offset: 0 }).els

  return (
    <svg viewBox="0 0 120 120" style={{ width: '100%', height: 'auto', display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={60} cy={60} r={52} fill="none" stroke="#efece5" strokeWidth={15} />
      {segments}
    </svg>
  )
}
