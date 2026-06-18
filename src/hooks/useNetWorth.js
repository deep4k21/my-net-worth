import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SOURCE_PALETTE } from '@/lib/netWorthUtils'

export function useNetWorth() {
  const [sources, setSources] = useState([])
  const [entries, setEntries] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setFormState] = useState({ sourceId: '', label: '', amount: '' })
  const [newSource, setNewSource] = useState({ name: '', type: 'asset' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: srcs }, { data: ents }, { data: hist }] = await Promise.all([
        supabase.from('sources').select('*').order('position'),
        supabase.from('entries').select('*'),
        supabase.from('history').select('amount').order('recorded_at'),
      ])
      const loadedSources = (srcs ?? []).map(s => ({ id: s.id, name: s.name, type: s.type, color: s.color }))
      setSources(loadedSources)
      setEntries((ents ?? []).map(e => ({ id: e.id, sourceId: e.source_id, label: e.label, amount: Number(e.amount) })))
      setHistory((hist ?? []).map(h => Number(h.amount)))
      setFormState(f => ({ ...f, sourceId: f.sourceId || loadedSources[0]?.id || '' }))
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
    setFormState(f => ({ ...f, label: '', amount: '' }))
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) { console.error(error); return }
    setEntries(es => es.filter(e => e.id !== id))
  }

  async function addSource() {
    if (!newSource.name.trim()) return
    const color = SOURCE_PALETTE[sources.length % SOURCE_PALETTE.length]
    const id = 's' + Date.now()
    const position = sources.length
    const { error } = await supabase.from('sources').insert({
      id, name: newSource.name.trim(), type: newSource.type, color, position,
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
    setFormState(f => {
      if (f.sourceId !== id) return f
      const remaining = sources.find(s => s.id !== id)
      return { ...f, sourceId: remaining?.id ?? '' }
    })
  }

  return {
    sources, entries, history, loading, form, newSource, setNewSource,
    setForm, addEntry, deleteEntry, addSource, deleteSource,
  }
}
