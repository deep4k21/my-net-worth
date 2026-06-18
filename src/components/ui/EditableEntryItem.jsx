import { useState } from 'react'
import { FREQUENCIES } from '@/hooks/useNetWorth'
import styles from './EditableEntryItem.module.css'

const FREQ_LABEL = Object.fromEntries(FREQUENCIES.map(f => [f.value, f.label]))

export function EditableEntryItem({ entry, recurringRule, isLiability, onUpdate, onDelete, onEnableRecurring, onDisableRecurring, onUpdateRecurring }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(entry.label)
  const [amount, setAmount] = useState(String(entry.amount))
  const [repeat, setRepeat] = useState(!!recurringRule)
  const [day, setDay] = useState(String(recurringRule?.dayOfMonth || 1))
  const [frequency, setFrequency] = useState(recurringRule?.frequency || 'monthly')
  const [recurringAmount, setRecurringAmount] = useState(
    recurringRule?.recurringAmount != null ? String(Math.abs(recurringRule.recurringAmount)) : ''
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const ok = await onUpdate(entry.id, label, amount)
    if (!ok) { setSaving(false); return }

    const wasRecurring = !!recurringRule
    const parsedDay = Math.min(28, Math.max(1, parseInt(day, 10) || 1))
    const rawAmt = parseFloat(String(recurringAmount).replace(/[^0-9.]/g, '')) || null
    const signedAmt = rawAmt != null && isLiability ? -rawAmt : rawAmt
    const opts = { dayOfMonth: parsedDay, frequency, recurringAmount: signedAmt }

    if (repeat && !wasRecurring) {
      await onEnableRecurring(entry.id, opts)
    } else if (!repeat && wasRecurring) {
      await onDisableRecurring(entry.id)
    } else if (repeat && wasRecurring) {
      const changed = parsedDay !== recurringRule.dayOfMonth ||
        frequency !== recurringRule.frequency ||
        String(recurringAmount) !== String(recurringRule.recurringAmount ?? '')
      if (changed) await onUpdateRecurring(entry.id, opts)
    }

    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setLabel(entry.label)
    setAmount(String(entry.amount))
    setRepeat(!!recurringRule)
    setDay(String(recurringRule?.dayOfMonth || 1))
    setFrequency(recurringRule?.frequency || 'monthly')
    setRecurringAmount(recurringRule?.recurringAmount != null ? String(recurringRule.recurringAmount) : '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={styles.editBlock}>
        <div className={styles.editRow}>
          <span className={styles.dot} style={{ background: entry.color }} />
          <div className={styles.editFields}>
            <input
              className={styles.editInput}
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Name"
            />
            <div className={styles.amtWrap}>
              <span className={styles.currency}>₹</span>
              <input
                className={styles.editInput}
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                inputMode="numeric"
                placeholder="0"
                style={{ paddingLeft: 22 }}
              />
            </div>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? '…' : '✓'}</button>
          <button className={styles.cancelBtn} onClick={cancel}>✕</button>
        </div>
        <div className={styles.recurringBlock}>
          <div className={styles.repeatRow}>
            <label className={styles.repeatToggle}>
              <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} />
              <span>Recurring</span>
            </label>
            {repeat && (
              <div className={styles.dayField}>
                <span className={styles.dayLabel}>on day</span>
                <input
                  className={styles.dayInput}
                  value={day}
                  onChange={e => setDay(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  placeholder="1–28"
                />
              </div>
            )}
          </div>
          {repeat && (
            <div className={styles.recurringFields}>
              <div className={styles.freqRow}>
                <span className={styles.dayLabel}>Frequency</span>
                <select
                  className={styles.freqSelect}
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                >
                  {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className={styles.recAmtRow}>
                <span className={styles.dayLabel}>{isLiability ? 'Reduction per period' : 'Addition per period'}</span>
                <div className={styles.recAmtWrap}>
                  <span className={styles.currency}>₹</span>
                  <input
                    className={styles.dayInput}
                    style={{ width: 110, paddingLeft: 20 }}
                    value={recurringAmount}
                    onChange={e => setRecurringAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.item}>
      <span className={styles.dot} style={{ background: entry.color }} />
      <div className={styles.info}>
        <div className={styles.label}>{entry.label}</div>
        <div className={styles.source}>
          {entry.sourceName}
          {recurringRule && (() => {
            const recAmt = recurringRule.recurringAmount
            const isNeg = recAmt != null && recAmt < 0
            return (
              <span className={isNeg ? styles.recurringBadgeRed : styles.recurringBadge}>
                ↻ {recurringRule.dayOfMonth}th · {FREQ_LABEL[recurringRule.frequency] || recurringRule.frequency}
                {recAmt != null && ` ${recAmt < 0 ? '−' : '+'}₹${Math.abs(recAmt).toLocaleString('en-IN')}`}
              </span>
            )
          })()}
        </div>
      </div>
      <span className={styles.amt} style={{ color: entry.amtColor }}>{entry.amtFmt}</span>
      <button className={styles.editBtn} onClick={() => setEditing(true)} title="Edit">✎</button>
      <button className={styles.deleteBtn} onClick={() => onDelete(entry.id)} title="Remove">×</button>
    </div>
  )
}
