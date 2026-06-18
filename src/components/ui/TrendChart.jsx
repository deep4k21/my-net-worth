export function TrendChart({ series, labels, gradientId = 'tgrad', width = 640, height = 250 }) {
  const padL = 6, padR = 6, padT = 16, padB = 30
  const min = Math.min(...series), max = Math.max(...series)
  const lo = min - (max - min) * 0.22
  const hi = max + (max - min) * 0.14
  const n = series.length
  const X = i => padL + (i / (n - 1)) * (width - padL - padR)
  const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (height - padT - padB)
  const accent = 'oklch(0.55 0.085 155)'
  const pts = series.map((v, i) => [X(i), Y(v)])
  const line = 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L')
  const baseY = height - padB
  const area = line + ' L' + X(n - 1).toFixed(1) + ',' + baseY + ' L' + padL + ',' + baseY + ' Z'

  const labelStep = width < 500 ? 3 : 2

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.16} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g, i) => {
        const y = padT + g * (height - padT - padB)
        return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} stroke="#efece5" strokeWidth={1} />
      })}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={accent} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(n - 1)} cy={Y(series[n - 1])} r={4.8} fill={accent} stroke="#fff" strokeWidth={2.2} />
      {labels.map((l, i) =>
        (i % labelStep === 0 || i === n - 1) ? (
          <text key={i} x={X(i)} y={height - (width < 500 ? 8 : 9)} fontSize={12} fill="#a8a297" textAnchor="middle" fontFamily="Hanken Grotesk">{l}</text>
        ) : null
      )}
    </svg>
  )
}
