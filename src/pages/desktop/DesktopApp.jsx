import { useState } from 'react'
import { useNetWorth, FREQUENCIES } from '@/hooks/useNetWorth'
import { useTheme } from '@/hooks/useTheme'
import {
  fmt, fmtShort, getGreeting, getDateFmt,
  computeNetWorth, buildBreakdown, buildSourcesView, buildTrendSeries,
} from '@/lib/netWorthUtils'
import { TrendChart } from '@/components/ui/TrendChart'
import { DonutChart } from '@/components/ui/DonutChart'
import { EditableEntryItem } from '@/components/ui/EditableEntryItem'
import { FutureView } from '@/components/ui/FutureView'
import styles from './DesktopApp.module.css'

export function DesktopApp() {
  const [view, setView] = useState('dashboard')
  const { dark, toggle: toggleTheme } = useTheme()
  const {
    sources, entries, history, recurring, loading,
    form, newSource, setNewSource,
    setForm, addEntry, deleteEntry, updateEntry,
    enableRecurring, disableRecurring, updateRecurring,
    addSource, deleteSource,
  } = useNetWorth()

  if (loading) return <div className={styles.loading}>Loading…</div>

  const { assets, liab, net, srcById } = computeNetWorth(sources, entries)
  const prev = history[history.length - 1]
  const change = net - prev
  const changePct = prev ? (change / prev) * 100 : 0
  const pos = change >= 0
  const changeColor = pos ? 'var(--accent-text-dk)' : 'var(--danger-dk)'
  const changeBg = pos ? 'var(--accent-bg-lt)' : 'var(--danger-bg)'

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
      amtFmt: (isLiab ? '−' : '+') + fmt(en.amount),
      amtColor: isLiab ? 'var(--danger)' : 'var(--accent)',
    }
  })

  const formSrc = srcById[form.sourceId] || sources[0] || {}
  const formIsLiab = formSrc.type === 'liability'

  const nav = (v) => ({
    bg: view === v ? 'var(--surface-hover)' : 'transparent',
    color: view === v ? 'var(--text-primary)' : 'var(--icon-secondary)',
    dot: view === v ? 'var(--accent)' : 'var(--dot-inactive)',
  })
  const nd = nav('dashboard'), na = nav('add'), ns = nav('sources'), nf = nav('future')

  const nsA = newSource.type === 'asset'

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>W</div>
          <span className={styles.brandName}>Worth</span>
          <button onClick={toggleTheme} className={styles.themeToggle} title={dark ? 'Switch to light' : 'Switch to dark'}>
            {dark ? '☀' : '◑'}
          </button>
        </div>

        <nav className={styles.nav}>
          <button onClick={() => setView('dashboard')} className={styles.navBtn} style={{ background: nd.bg, color: nd.color }}>
            <span className={styles.navDot} style={{ background: nd.dot }} />
            Dashboard
          </button>
          <button onClick={() => setView('add')} className={styles.navBtn} style={{ background: na.bg, color: na.color }}>
            <span className={styles.navDot} style={{ background: na.dot }} />
            Add worth
          </button>
          <button onClick={() => setView('sources')} className={styles.navBtn} style={{ background: ns.bg, color: ns.color }}>
            <span className={styles.navDot} style={{ background: ns.dot }} />
            Sources
          </button>
          <button onClick={() => setView('future')} className={styles.navBtn} style={{ background: nf.bg, color: nf.color }}>
            <span className={styles.navDot} style={{ background: nf.dot }} />
            See future
          </button>
        </nav>

        <div className={styles.sidebarCard}>
          <div className={styles.sidebarCardLabel}>Net worth</div>
          <div className={styles.sidebarNetWorth}>{fmt(net)}</div>
          <div className={styles.sidebarChange} style={{ color: changeColor }}>
            {pos ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}% this month
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.mainInner}>

          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <section>
              <div className={styles.dashHeader}>
                <div>
                  <div className={styles.metaLabel}>{getDateFmt()}</div>
                  <h1 className={styles.pageTitle}>{getGreeting()}</h1>
                </div>
                <button className={styles.btnPrimary} onClick={() => setView('add')}>+ Add worth</button>
              </div>

              <div className={styles.heroCard}>
                <div>
                  <div className={styles.heroLabel}>Total net worth</div>
                  <div className={styles.heroAmount}>{fmt(net)}</div>
                  <div className={styles.heroBadge} style={{ background: changeBg, color: changeColor }}>
                    {pos ? '▲' : '▼'} {(pos ? '+' : '−') + fmt(Math.abs(change))}{' '}
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>({Math.abs(changePct).toFixed(2)}%) this month</span>
                  </div>
                </div>
                <div className={styles.heroStats}>
                  <div>
                    <div className={styles.statLabel}>Assets</div>
                    <div className={styles.statValue}>{fmt(assets)}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Liabilities</div>
                    <div className={styles.statValue} style={{ color: 'var(--danger)' }}>−{fmt(liab)}</div>
                  </div>
                </div>
              </div>

              <div className={styles.chartsGrid}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Growth over time</h2>
                    <span className={styles.cardMeta}>Last 12 months</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <TrendChart series={series} labels={labels} gradientId="tgrad-desktop" width={640} height={250} />
                  </div>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle} style={{ marginBottom: 18 }}>Asset mix</h2>
                  <div style={{ position: 'relative', width: 150, margin: '0 auto 8px' }}>
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
              </div>

              <h2 className={styles.sectionTitle}>All sources</h2>
              <div className={styles.sourcesGrid}>
                {sourcesView.map(s => (
                  <div key={s.id} className={styles.sourceCard}>
                    <div className={styles.sourceCardHeader}>
                      <span className={styles.sourceDot} style={{ background: s.color }} />
                      <span className={styles.sourceName}>{s.name}</span>
                      <span className={styles.sourceTag} style={{ color: s.tagColor, background: s.tagBg }}>{s.tagLabel}</span>
                    </div>
                    <div className={styles.sourceAmount} style={{ color: s.amtColor }}>{s.totalFmt}</div>
                    <div className={styles.sourceBar}>
                      <div className={styles.sourceBarFill} style={{ width: s.barPctStr, background: s.color }} />
                    </div>
                    <div className={styles.sourceCount}>{s.countFmt}</div>
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
              <p className={styles.pageDesc}>Record a balance for any account or asset. Liabilities are subtracted automatically.</p>

              <div className={styles.addGrid}>
                <div className={styles.card}>
                  <label className={styles.fieldLabel}>Source</label>
                  <select
                    value={form.sourceId}
                    onChange={e => setForm('sourceId', e.target.value)}
                    className={styles.select}
                  >
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className={styles.typeHint} style={{ color: formIsLiab ? 'var(--danger-dk)' : 'var(--accent-text)' }}>
                    {formIsLiab ? 'This will be subtracted from your net worth.' : 'This will be added to your net worth.'}
                  </div>

                  <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Account / asset name</label>
                  <input
                    value={form.label}
                    onChange={e => setForm('label', e.target.value)}
                    placeholder="e.g. SBI Savings, Tesla Model 3"
                    className={styles.input}
                  />

                  <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Amount</label>
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

                  <div className={styles.repeatRow}>
                    <label className={styles.repeatToggle}>
                      <input type="checkbox" checked={form.repeat} onChange={e => setForm('repeat', e.target.checked)} />
                      <span>Recurring</span>
                    </label>
                    {form.repeat && (
                      <div className={styles.dayField}>
                        <span className={styles.dayLabel}>on day</span>
                        <input
                          className={styles.dayInput}
                          value={form.dayOfMonth}
                          onChange={e => setForm('dayOfMonth', e.target.value.replace(/[^0-9]/g, ''))}
                          inputMode="numeric"
                          placeholder="1–28"
                        />
                      </div>
                    )}
                  </div>

                  {form.repeat && (
                    <>
                      <label className={styles.fieldLabel} style={{ marginTop: 14 }}>Frequency</label>
                      <select
                        value={form.frequency}
                        onChange={e => setForm('frequency', e.target.value)}
                        className={styles.select}
                      >
                        {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>

                      <label className={styles.fieldLabel} style={{ marginTop: 14 }}>
                        {formIsLiab ? 'Reduction per period (optional)' : 'Addition per period (optional)'}
                      </label>
                      <div style={{ position: 'relative', marginTop: 7 }}>
                        <span className={styles.currencySign}>₹</span>
                        <input
                          value={form.recurringAmount}
                          onChange={e => setForm('recurringAmount', e.target.value.replace(/[^0-9.]/g, ''))}
                          inputMode="numeric"
                          placeholder="0"
                          className={styles.input}
                          style={{ paddingLeft: 30 }}
                        />
                      </div>
                    </>
                  )}

                  <button className={styles.btnPrimary} style={{ width: '100%', marginTop: 20 }} onClick={addEntry}>
                    Add to net worth
                  </button>
                </div>

                <div>
                  <h2 className={styles.sectionTitle} style={{ marginTop: 2, marginBottom: 12 }}>Recent entries</h2>
                  <div className={styles.entryList}>
                    {recentEntries.map(e => {
                      const rec = recurring.find(r => r.entryId === e.id) ?? null
                      const src = srcById[e.sourceId]
                      return (
                        <EditableEntryItem
                          key={e.id}
                          entry={e}
                          recurringRule={rec}
                          isLiability={src?.type === 'liability'}
                          onUpdate={updateEntry}
                          onDelete={deleteEntry}
                          onEnableRecurring={enableRecurring}
                          onDisableRecurring={disableRecurring}
                          onUpdateRecurring={updateRecurring}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* FUTURE */}
          {view === 'future' && (
            <section>
              <div className={styles.metaLabel}>Projection</div>
              <h1 className={styles.pageTitle}>See your future net worth</h1>
              <p className={styles.pageDesc}>Based on your recurring entries, we'll estimate where you'll be by any month.</p>
              <div style={{ marginTop: 28 }}>
                <FutureView sources={sources} entries={entries} recurring={recurring} isMobile={false} />
              </div>
            </section>
          )}

          {/* SOURCES */}
          {view === 'sources' && (
            <section>
              <div className={styles.metaLabel}>Categories</div>
              <h1 className={styles.pageTitle}>Manage sources</h1>
              <p className={styles.pageDesc}>Add custom categories to organise what makes up your net worth. New sources appear in the Add worth dropdown.</p>

              <div className={styles.sourcesManageGrid}>
                <div className={styles.sourcesList}>
                  {sourcesView.map(s => (
                    <div key={s.id} className={styles.sourceManageItem}>
                      <span className={styles.sourceDotLg} style={{ background: s.color }} />
                      <div style={{ flex: 1 }}>
                        <div className={styles.sourceManageName}>{s.name}</div>
                        <div className={styles.sourceManageCount}>{s.countFmt}</div>
                      </div>
                      <span className={styles.sourceTag} style={{ color: s.tagColor, background: s.tagBg }}>{s.tagLabel}</span>
                      <span className={styles.sourceManageAmt} style={{ color: s.amtColor }}>{s.totalFmt}</span>
                      <button className={styles.deleteBtn} onClick={s.onDelete} title="Delete source">×</button>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle} style={{ marginBottom: 16 }}>New source</h2>
                  <label className={styles.fieldLabel}>Name</label>
                  <input
                    value={newSource.name}
                    onChange={e => setNewSource(ns => ({ ...ns, name: e.target.value }))}
                    placeholder="e.g. Crypto, Real estate"
                    className={styles.input}
                  />

                  <label className={styles.fieldLabel} style={{ marginTop: 18 }}>Type</label>
                  <div className={styles.toggle}>
                    <button
                      onClick={() => setNewSource(ns => ({ ...ns, type: 'asset' }))}
                      className={styles.toggleBtn}
                      style={{
                        background: nsA ? 'var(--bg-card)' : 'transparent',
                        color: nsA ? 'var(--text-primary)' : 'var(--icon-secondary)',
                        boxShadow: nsA ? 'var(--shadow-toggle)' : 'none',
                      }}
                    >Asset</button>
                    <button
                      onClick={() => setNewSource(ns => ({ ...ns, type: 'liability' }))}
                      className={styles.toggleBtn}
                      style={{
                        background: !nsA ? 'var(--bg-card)' : 'transparent',
                        color: !nsA ? 'var(--text-primary)' : 'var(--icon-secondary)',
                        boxShadow: !nsA ? 'var(--shadow-toggle)' : 'none',
                      }}
                    >Liability</button>
                  </div>

                  <button
                    className={styles.btnDark}
                    style={{ width: '100%', marginTop: 22 }}
                    onClick={addSource}
                  >Add source</button>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}
