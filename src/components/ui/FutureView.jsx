import { useState } from 'react'
import { buildFutureProjection, fmt, fmtShort, MONTH_LABELS } from '@/lib/netWorthUtils'
import { TrendChart } from '@/components/ui/TrendChart'
import styles from './FutureView.module.css'

const FREQ_LABEL = { monthly: 'mo', quarterly: 'qtr', 'half-yearly': '6mo', yearly: 'yr' }

export function FutureView({ sources, entries, recurring, isMobile }) {
  const now = new Date()
  const [targetYear, setTargetYear] = useState(now.getFullYear() + 1)
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1)

  const result = buildFutureProjection(sources, entries, recurring, targetYear, targetMonth)

  const yearOptions = []
  for (let y = now.getFullYear(); y <= now.getFullYear() + 10; y++) yearOptions.push(y)

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <span className={styles.controlLabel}>Project to</span>
        <select
          className={styles.select}
          value={targetMonth}
          onChange={e => setTargetMonth(Number(e.target.value))}
        >
          {MONTH_LABELS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          className={styles.select}
          value={targetYear}
          onChange={e => setTargetYear(Number(e.target.value))}
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!result ? (
        <div className={styles.empty}>Pick a future month to see the projection.</div>
      ) : (
        <>
          <div className={styles.heroRow}>
            <div className={styles.heroCard}>
              <div className={styles.heroLabel}>Today</div>
              <div className={styles.heroAmt}>{fmt(result.currentNet)}</div>
            </div>
            <div className={styles.arrow}>→</div>
            <div className={styles.heroCard}>
              <div className={styles.heroLabel}>
                {MONTH_LABELS[targetMonth - 1]} {targetYear}
              </div>
              <div className={styles.heroAmt} style={{ color: result.futureNet >= result.currentNet ? 'var(--accent-text-md)' : 'var(--danger-md)' }}>
                {fmt(result.futureNet)}
              </div>
              <div className={styles.gainBadge} style={{
                color: result.futureNet >= result.currentNet ? 'var(--accent-text-md)' : 'var(--danger-md)',
                background: result.futureNet >= result.currentNet ? 'var(--accent-bg)' : 'var(--danger-bg)',
              }}>
                {result.futureNet >= result.currentNet ? '+' : '−'}
                {fmt(Math.abs(result.futureNet - result.currentNet))}
                {' '}over {result.totalMonths} months
              </div>
            </div>
          </div>

          <div className={styles.chartWrap}>
            <TrendChart
              series={result.series}
              labels={result.labels}
              gradientId="tgrad-future"
              width={isMobile ? 480 : 720}
              height={isMobile ? 180 : 220}
            />
          </div>

          {result.changes.length > 0 && (
            <>
              <div className={styles.sectionTitle}>What's changing</div>
              <div className={styles.changeList}>
                {result.changes.map(c => (
                  <div key={c.id} className={styles.changeItem}>
                    <div className={styles.changeTop}>
                      <span className={styles.dot} style={{ background: c.color }} />
                      <div className={styles.changeInfo}>
                        <div className={styles.changeLabel}>{c.label}</div>
                        <div className={styles.changeMeta}>
                          {c.sourceName} · {c.periods}× {FREQ_LABEL[c.frequency] || c.frequency}
                        </div>
                      </div>
                      <div className={styles.changeGain} style={{
                        color: c.gain > 0 ? 'var(--accent-text-md)' : 'var(--danger-md)',
                        background: c.gain > 0 ? 'var(--accent-bg)' : 'var(--danger-bg)',
                      }}>
                        {c.gain > 0 ? '+' : '−'}{fmtShort(Math.abs(c.gain))}
                      </div>
                    </div>
                    <div className={styles.changeAmts}>
                      <div className={styles.changeCurrent}>{fmt(c.current)}</div>
                      <div className={styles.changeArrow}>→</div>
                      <div className={styles.changeProjected}>{fmt(c.projected)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {result.changes.length === 0 && (
            <div className={styles.empty}>No recurring entries set up yet. Add recurring amounts to entries to see projections.</div>
          )}
        </>
      )}
    </div>
  )
}
