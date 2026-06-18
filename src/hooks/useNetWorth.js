import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SOURCE_PALETTE } from '@/lib/netWorthUtils'

export const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
]

export function useNetWorth() {
  const [sources, setSources] = useState([])
  const [entries, setEntries] = useState([])
  const [history, setHistory] = useState([])
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setFormState] = useState({
    sourceId: '', label: '', amount: '',
    repeat: false, dayOfMonth: '1', frequency: 'monthly', recurringAmount: '',
  })
  const [newSource, setNewSource] = useState({ name: '', type: 'asset' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: srcs }, { data: ents }, { data: hist }, { data: rec }] = await Promise.all([
        supabase.from('sources').select('*').order('position'),
        supabase.from('entries').select('*'),
        supabase.from('history').select('amount').order('recorded_at'),
        supabase.from('recurring_entries').select('*'),
      ])
      const loadedSources = (srcs ?? []).map(s => ({ id: s.id, name: s.name, type: s.type, color: s.color }))
      setSources(loadedSources)
      setEntries((ents ?? []).map(e => ({ id: e.id, sourceId: e.source_id, label: e.label, amount: Number(e.amount) })))
      setHistory((hist ?? []).map(h => Number(h.amount)))
      setRecurring((rec ?? []).map(r => ({
        id: r.id, entryId: r.entry_id, sourceId: r.source_id,
        label: r.label, amount: Number(r.amount),
        recurringAmount: r.recurring_amount != null ? Number(r.recurring_amount) : null,
        dayOfMonth: r.day_of_month, frequency: r.frequency ?? 'monthly',
      })))
      const firstId = loadedSources[0]?.id || ''
      setFormState(f => ({ ...f, sourceId: f.sourceId || firstId }))
      setLoading(false)
    }
    load()
  }, [])

  function setForm(field, value) {
    setFormState(f => ({ ...f, [field]: value }))
  }

  async function addEntry() {
    const amt = parseFloat(String(form.amount).replace(/[^0-9.]/g, ''))
    if (!form.label.trim() || !amt || amt <= 0) return
    const id = 'e' + Date.now()
    const { error } = await supabase.from('entries').insert({
      id, source_id: form.sourceId, label: form.label.trim(), amount: amt,
    })
    if (error) { console.error(error); return }
    setEntries(es => [...es, { id, sourceId: form.sourceId, label: form.label.trim(), amount: amt }])

    if (form.repeat) {
      const day = parseInt(form.dayOfMonth, 10)
      const srcType = sources.find(s => s.id === form.sourceId)?.type
      const rawRecAmt = parseFloat(String(form.recurringAmount).replace(/[^0-9.]/g, '')) || null
      const recAmt = rawRecAmt != null && srcType === 'liability' ? -rawRecAmt : rawRecAmt
      if (day >= 1 && day <= 28) {
        const rid = 'rec' + Date.now()
        await supabase.from('recurring_entries').insert({
          id: rid, entry_id: id, source_id: form.sourceId,
          label: form.label.trim(), amount: amt,
          recurring_amount: recAmt,
          day_of_month: day, frequency: form.frequency,
        })
        setRecurring(rs => [...rs, {
          id: rid, entryId: id, sourceId: form.sourceId,
          label: form.label.trim(), amount: amt,
          recurringAmount: recAmt,
          dayOfMonth: day, frequency: form.frequency,
        }])
      }
    }

    setFormState(f => ({ ...f, label: '', amount: '', repeat: false, dayOfMonth: '1', frequency: 'monthly', recurringAmount: '' }))
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) { console.error(error); return }
    setEntries(es => es.filter(e => e.id !== id))
    setRecurring(rs => rs.filter(r => r.entryId !== id))
  }

  async function updateEntry(id, label, amount) {
    const amt = parseFloat(String(amount).replace(/[^0-9.]/g, ''))
    if (!label.trim() || !amt || amt <= 0) return false
    const { error } = await supabase.from('entries').update({ label: label.trim(), amount: amt }).eq('id', id)
    if (error) { console.error(error); return false }
    setEntries(es => es.map(e => e.id === id ? { ...e, label: label.trim(), amount: amt } : e))
    const rec = recurring.find(r => r.entryId === id)
    if (rec) {
      await supabase.from('recurring_entries').update({ label: label.trim() }).eq('entry_id', id)
      setRecurring(rs => rs.map(r => r.entryId === id ? { ...r, label: label.trim() } : r))
    }
    return true
  }

  async function enableRecurring(entryId, { dayOfMonth, frequency, recurringAmount }) {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return
    const rid = 'rec' + Date.now()
    const srcType = sources.find(s => s.id === entry.sourceId)?.type
    const rawRecAmt = recurringAmount ? parseFloat(String(recurringAmount).replace(/[^0-9.]/g, '')) || null : null
    const recAmt = rawRecAmt != null && srcType === 'liability' ? -rawRecAmt : rawRecAmt
    const { error } = await supabase.from('recurring_entries').insert({
      id: rid, entry_id: entryId, source_id: entry.sourceId,
      label: entry.label, amount: entry.amount,
      recurring_amount: recAmt,
      day_of_month: dayOfMonth, frequency,
    })
    if (error) { console.error(error); return }
    setRecurring(rs => [...rs, {
      id: rid, entryId, sourceId: entry.sourceId,
      label: entry.label, amount: entry.amount,
      recurringAmount: recAmt,
      dayOfMonth, frequency,
    }])
  }

  async function disableRecurring(entryId) {
    const { error } = await supabase.from('recurring_entries').delete().eq('entry_id', entryId)
    if (error) { console.error(error); return }
    setRecurring(rs => rs.filter(r => r.entryId !== entryId))
  }

  async function updateRecurring(entryId, { dayOfMonth, frequency, recurringAmount }) {
    const entry = entries.find(e => e.id === entryId)
    const srcType = sources.find(s => s.id === entry?.sourceId)?.type
    const rawRecAmt = recurringAmount ? parseFloat(String(recurringAmount).replace(/[^0-9.]/g, '')) || null : null
    const recAmt = rawRecAmt != null && srcType === 'liability' ? -rawRecAmt : rawRecAmt
    const { error } = await supabase.from('recurring_entries')
      .update({ day_of_month: dayOfMonth, frequency, recurring_amount: recAmt })
      .eq('entry_id', entryId)
    if (error) { console.error(error); return }
    setRecurring(rs => rs.map(r => r.entryId === entryId
      ? { ...r, dayOfMonth, frequency, recurringAmount: recAmt }
      : r
    ))
  }

  async function addSource() {
    if (!newSource.name.trim()) return
    const color = SOURCE_PALETTE[sources.length % SOURCE_PALETTE.length]
    const id = 's' + Date.now()
    const { error } = await supabase.from('sources').insert({
      id, name: newSource.name.trim(), type: newSource.type, color, position: sources.length,
    })
    if (error) { console.error(error); return }
    setSources(ss => [...ss, { id, name: newSource.name.trim(), type: newSource.type, color }])
    setNewSource({ name: '', type: 'asset' })
  }

  async function deleteSource(id) {
    const { error } = await supabase.from('sources').delete().eq('id', id)
    if (error) { console.error(error); return }
    setSources(ss => ss.filter(s => s.id !== id))
    setEntries(es => es.filter(e => e.sourceId !== id))
    setRecurring(rs => rs.filter(r => r.sourceId !== id))
    setFormState(f => {
      if (f.sourceId !== id) return f
      const remaining = sources.find(s => s.id !== id)
      return { ...f, sourceId: remaining?.id ?? '' }
    })
  }

  return {
    sources, entries, history, recurring, loading,
    form, newSource, setNewSource,
    setForm, addEntry, deleteEntry, updateEntry,
    enableRecurring, disableRecurring, updateRecurring,
    addSource, deleteSource,
  }
}
