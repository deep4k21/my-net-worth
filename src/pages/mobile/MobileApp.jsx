import { useState } from 'react'
import { useNetWorth } from '@/hooks/useNetWorth'
import {
  fmt, fmtShort, getGreeting, getDateFmt,
  computeNetWorth, buildBreakdown, buildSourcesView, buildTrendSeries,
} from '@/lib/netWorthUtils'
import { TrendChart } from '@/components/ui/TrendChart'
import { DonutChart } from '@/components/ui/DonutChart'
import styles from './MobileApp.module.css'

export function MobileApp() {
  const [view, setView] = useState('dashboard')
  const {
    sources, entries, history, loading, form, newSource, setNewSource,
    setForm, addEntry, deleteEntry, addSource, deleteSource,
  } = useNetWorth()

  if (loading) return <div className={styles.loading}>Loading…</div>

  const { assets, liab, net, srcById } = computeNetWorth(sources, entries)
  const prev = history[history.length - 1]
  const change = net - prev
  const changePct = prev ? (change / prev) * 100 : 0
  const pos = change >= 0
  const changeColor = pos ? 'oklch(0.48 0.09 155)' : 'oklch(0.54 0.12 30)'
  const changeBg = pos ? 'oklch(0.96 0.03 155)' : 'oklch(0.96 0.035 40)'

  const { series, labels } = buildTrendSeries(history, net)
  const breakdown = buildBreakdown(sources, entries, assets)
  const sourcesView = buildSourcesView(sources, entries, deleteSource)

  const recentEntries = [...entries].reverse().slice(0, 7).map(en => {
    const src = srcById[en.sourceId] || {}
    const isLiab = src.type === 'liability'
    return {
      ...en,
      sourceName: src.name || '—',
      color: src.color || '#ccc',
      amtFmt: (isLiab ? '−' : '') + fmt(en.amount),
      amtColor: isLiab ? 'oklch(0.55 0.10 32)' : '#1d1b18',
    }
  })

  const formSrc = srcById[form.sourceId] || sources[0] || {}
  const formIsLiab = formSrc.type === 'liability'

  const nav = (v) => ({
    color: view === v ? '#1d1b18' : '#9a948a',
    dot: view === v ? 'oklch(0.55 0.085 155)' : '#cdc8bd',
    op: view === v ? 1 : 0.5,
  })
  const nd = nav('dashboard'), na = nav('add'), ns = nav('sources')
  const nsA = newSource.type === 'asset'

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>W</div>
          <span className={styles.brandName}>Worth</span>
        </div>
        <div className={styles.headerNet}>
          <div className={styles.headerNetLabel}>Net worth</div>
          <div className={styles.headerNetValue}>{fmt(net)}</div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className={styles.main}>

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <section>
            <div className={styles.metaLabel}>{getDateFmt()}</div>
            <h1 className={styles.pageTitle}>{getGreeting()}</h1>

            <div className={styles.card}>
              <div className={styles.heroLabel}>Total net worth</div>
              <div className={styles.heroAmount}>{fmt(net)}</div>
              <div className={styles.heroBadge} style={{ background: changeBg, color: changeColor }}>
                {pos ? '▲' : '▼'} {(pos ? '+' : '−') + fmt(Math.abs(change))}{' '}
                <span style={{ opacity: 0.7, fontWeight: 500 }}>({Math.abs(changePct).toFixed(2)}%)</span>
              </div>
              <div className={styles.heroStats}>
                <div style={{ flex: 1 }}>
                  <div className={styles.statLabel}>Assets</div>
                  <div className={styles.statValue}>{fmt(assets)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.statLabel}>Liabilities</div>
                  <div className={styles.statValue} style={{ color: 'oklch(0.55 0.10 32)' }}>−{fmt(liab)}</div>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: 14 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Growth over time</h2>
                <span className={styles.cardMeta}>12 months</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <TrendChart series={series} labels={labels} gradientId="tgrad-mobile" width={480} height={220} />
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: 14 }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 16 }}>Asset mix</h2>
              <div style={{ position: 'relative', width: 148, margin: '0 auto 10px' }}>
                <DonutChart breakdown={breakdown} />
                <div className={styles.donutCenter}>
                  <span className={styles.donutCenterLabel}>Assets</span>
                  <span className={styles.donutCenterValue}>{fmtShort(assets)}</span>
                </div>
              </div>
              <div className={styles.legendList}>
                {breakdown.map(b => (
                  <div key={b.id} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: b.color }} />
                    <span className={styles.legendName}>{b.name}</span>
                    <span className={styles.legendPct}>{b.pctFmt}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className={styles.sectionTitle}>All sources</h2>
            <div className={styles.sourcesList}>
              {sourcesView.map(s => (
                <div key={s.id} className={styles.sourceCard}>
                  <div className={styles.sourceCardHeader}>
                    <span className={styles.sourceDot} style={{ background: s.color }} />
                    <span className={styles.sourceName}>{s.name}</span>
                    <span className={styles.sourceTag} style={{ color: s.tagColor, background: s.tagBg }}>{s.tagLabel}</span>
                  </div>
                  <div className={styles.sourceBottom}>
                    <span className={styles.sourceAmount} style={{ color: s.amtColor }}>{s.totalFmt}</span>
                    <span className={styles.sourceCount}>{s.countFmt}</span>
                  </div>
                  <div className={styles.sourceBar}>
                    <div className={styles.sourceBarFill} style={{ width: s.barPctStr, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ADD WORTH */}
        {view === 'add' && (
          <section>
            <div className={styles.metaLabel}>Manual entry</div>
            <h1 className={styles.pageTitle}>Add to your net worth</h1>

            <div className={styles.card} style={{ marginTop: 18 }}>
              <label className={styles.fieldLabel}>Source</label>
              <select
                value={form.sourceId}
                onChange={e => setForm('sourceId', e.target.value)}
                className={styles.select}
              >
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className={styles.typeHint} style={{ color: formIsLiab ? 'oklch(0.54 0.10 32)' : 'oklch(0.46 0.07 155)' }}>
                {formIsLiab ? 'This will be subtracted from your net worth.' : 'This will be added to your net worth.'}
              </div>

              <label className={styles.fieldLabel} style={{ marginTop: 18 }}>Account / asset name</label>
              <input
                value={form.label}
                onChange={e => setForm('label', e.target.value)}
                placeholder="e.g. SBI Savings, Tesla Model 3"
                className={styles.input}
              />

              <label className={styles.fieldLabel} style={{ marginTop: 18 }}>Amount</label>
              <div style={{ position: 'relative', marginTop: 7 }}>
                <span className={styles.currencySign}>₹</span>
                <input
                  value={form.amount}
                  onChange={e => setForm('amount', e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="numeric"
                  placeholder="0"
                  className={styles.input}
                  style={{ paddingLeft: 30 }}
                />
              </div>

              <button className={styles.btnPrimary} style={{ width: '100%', marginTop: 22 }} onClick={addEntry}>
                Add to net worth
              </button>
            </div>

            <h2 className={styles.sectionTitle}>Recent entries</h2>
            <div className={styles.entryList}>
              {recentEntries.map(e => (
                <div key={e.id} className={styles.entryItem}>
                  <span className={styles.entryDot} style={{ background: e.color }} />
                  <div className={styles.entryInfo}>
                    <div className={styles.entryLabel}>{e.label}</div>
                    <div className={styles.entrySource}>{e.sourceName}</div>
                  </div>
                  <span className={styles.entryAmt} style={{ color: e.amtColor }}>{e.amtFmt}</span>
                  <button className={styles.deleteBtn} onClick={() => deleteEntry(e.id)} title="Remove">×</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SOURCES */}
        {view === 'sources' && (
          <section>
            <div className={styles.metaLabel}>Categories</div>
            <h1 className={styles.pageTitle}>Manage sources</h1>

            <div className={styles.card} style={{ marginTop: 18 }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 14 }}>New source</h2>
              <label className={styles.fieldLabel}>Name</label>
              <input
                value={newSource.name}
                onChange={e => setNewSource(ns => ({ ...ns, name: e.target.value }))}
                placeholder="e.g. Crypto, Real estate"
                className={styles.input}
              />

              <label className={styles.fieldLabel} style={{ marginTop: 16 }}>Type</label>
              <div className={styles.toggle}>
                <button
                  onClick={() => setNewSource(ns => ({ ...ns, type: 'asset' }))}
                  className={styles.toggleBtn}
                  style={{
                    background: nsA ? '#fff' : 'transparent',
                    color: nsA ? '#1d1b18' : '#8a857c',
                    boxShadow: nsA ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                  }}
                >Asset</button>
                <button
                  onClick={() => setNewSource(ns => ({ ...ns, type: 'liability' }))}
                  className={styles.toggleBtn}
                  style={{
                    background: !nsA ? '#fff' : 'transparent',
                    color: !nsA ? '#1d1b18' : '#8a857c',
                    boxShadow: !nsA ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                  }}
                >Liability</button>
              </div>
              <button className={styles.btnDark} style={{ width: '100%', marginTop: 20 }} onClick={addSource}>
                Add source
              </button>
            </div>

            <h2 className={styles.sectionTitle}>Your sources</h2>
            <div className={styles.sourcesList}>
              {sourcesView.map(s => (
                <div key={s.id} className={styles.sourceManageItem}>
                  <span className={styles.sourceDotLg} style={{ background: s.color }} />
                  <div className={styles.sourceManageInfo}>
                    <div className={styles.sourceManageName}>{s.name}</div>
                    <div className={styles.sourceManageMeta}>{s.totalFmt} · {s.countFmt}</div>
                  </div>
                  <span className={styles.sourceTag} style={{ color: s.tagColor, background: s.tagBg }}>{s.tagLabel}</span>
                  <button className={styles.deleteBtn} onClick={s.onDelete} title="Delete source" style={{ fontSize: 21, padding: '6px 8px' }}>×</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom nav */}
      <nav className={styles.bottomNav}>
        <button onClick={() => setView('dashboard')} className={styles.navBtn} style={{ color: nd.color }}>
          <span className={styles.navDot} style={{ background: nd.dot, opacity: nd.op }} />
          <span className={styles.navLabel}>Dashboard</span>
        </button>
        <button onClick={() => setView('add')} className={styles.navBtn} style={{ color: na.color }}>
          <span className={styles.navDot} style={{ background: na.dot, opacity: na.op }} />
          <span className={styles.navLabel}>Add worth</span>
        </button>
        <button onClick={() => setView('sources')} className={styles.navBtn} style={{ color: ns.color }}>
          <span className={styles.navDot} style={{ background: ns.dot, opacity: ns.op }} />
          <span className={styles.navLabel}>Sources</span>
        </button>
      </nav>
    </div>
  )
}
