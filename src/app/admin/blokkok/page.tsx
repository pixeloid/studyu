'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface InternalBlock {
  id: string
  start_datetime: string
  end_datetime: string
  block_type: string
  title: string
  description: string | null
  created_by: string | null
  is_recurring: boolean | null
  recurrence_rule: string | null
}

const blockTypes = [
  { value: 'maintenance', label: 'Karbantartás', color: 'yellow' as const },
  { value: 'internal_event', label: 'Belső esemény', color: 'blue' as const },
  { value: 'private_booking', label: 'Privát foglalás', color: 'blue' as const },
  { value: 'preparation', label: 'Előkészület', color: 'outline' as const },
  { value: 'other', label: 'Egyéb', color: 'outline' as const },
]

export default function InternalBlocksPage() {
  const [blocks, setBlocks] = useState<InternalBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newBlock, setNewBlock] = useState<Partial<InternalBlock> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    const { data } = await supabase
      .from('internal_blocks')
      .select('*')
      .gte('end_datetime', new Date().toISOString())
      .order('start_datetime')

    if (data) {
      setBlocks(data)
    }
    setLoading(false)
  }

  const updateBlock = async (block: InternalBlock) => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('internal_blocks')
      .update({
        start_datetime: block.start_datetime,
        end_datetime: block.end_datetime,
        block_type: block.block_type,
        title: block.title,
        description: block.description,
      })
      .eq('id', block.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Blokk sikeresen mentve!' })
      setEditingId(null)
    }
    setSaving(false)
  }

  const createBlock = async () => {
    if (!newBlock?.title || !newBlock?.start_datetime || !newBlock?.end_datetime || !newBlock?.block_type) {
      setMessage({ type: 'error', text: 'Kérjük töltse ki a kötelező mezőket' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('internal_blocks')
      .insert({
        start_datetime: newBlock.start_datetime,
        end_datetime: newBlock.end_datetime,
        block_type: newBlock.block_type,
        title: newBlock.title,
        description: newBlock.description || null,
        created_by: user?.id || null,
        is_recurring: false,
      })

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a létrehozás során' })
    } else {
      setMessage({ type: 'success', text: 'Blokk sikeresen létrehozva!' })
      setNewBlock(null)
      loadBlocks()
    }
    setSaving(false)
  }

  const deleteBlock = async (id: string) => {
    if (!confirm('Biztosan törli ezt a blokkot?')) return

    const { error } = await supabase
      .from('internal_blocks')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a törlés során' })
    } else {
      setMessage({ type: 'success', text: 'Blokk törölve' })
      loadBlocks()
    }
  }

  const handleChange = (id: string, field: keyof InternalBlock, value: string | null) => {
    setBlocks(prev =>
      prev.map(b => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  const formatDateTime = (dt: string) => {
    return format(new Date(dt), 'yyyy. MMM d. HH:mm', { locale: hu })
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 mb-8" />
        <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Belső blokkolások</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3" style={{ backgroundColor: 'var(--bauhaus-blue)', transform: 'rotate(45deg)' }} />
          </div>
        </div>
        <BauhausButton
          onClick={() => {
            const now = new Date()
            const later = new Date(now.getTime() + 4 * 60 * 60 * 1000)
            setNewBlock({
              title: '',
              block_type: 'maintenance',
              start_datetime: now.toISOString().slice(0, 16),
              end_datetime: later.toISOString().slice(0, 16),
              description: '',
            })
          }}
          variant="primary"
        >
          + Új blokk
        </BauhausButton>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 border-[3px] ${
            message.type === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-[var(--bauhaus-red)] bg-red-50'
          }`}
          style={{
            boxShadow: message.type === 'success'
              ? '4px 4px 0 #22c55e'
              : '4px 4px 0 var(--bauhaus-red)'
          }}
        >
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-700' : 'text-[var(--bauhaus-red)]'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* New block form */}
      {newBlock && (
        <BauhausCard className="mb-6" accentColor="blue" hasCornerAccent accentPosition="top-left">
          <h3 className="font-bugrino text-lg uppercase tracking-wider mb-6">Új blokk létrehozása</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Megnevezés *</label>
              <input
                type="text"
                value={newBlock.title || ''}
                onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                placeholder="Pl. Karbantartás"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Típus *</label>
              <select
                value={newBlock.block_type || 'maintenance'}
                onChange={(e) => setNewBlock({ ...newBlock, block_type: e.target.value })}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              >
                {blockTypes.map((bt) => (
                  <option key={bt.value} value={bt.value}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Kezdés *</label>
              <input
                type="datetime-local"
                value={newBlock.start_datetime || ''}
                onChange={(e) => setNewBlock({ ...newBlock, start_datetime: e.target.value })}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Vége *</label>
              <input
                type="datetime-local"
                value={newBlock.end_datetime || ''}
                onChange={(e) => setNewBlock({ ...newBlock, end_datetime: e.target.value })}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Leírás</label>
              <textarea
                value={newBlock.description || ''}
                onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                placeholder="Opcionális megjegyzés"
                rows={2}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <BauhausButton
              onClick={() => setNewBlock(null)}
              variant="default"
            >
              Mégse
            </BauhausButton>
            <BauhausButton
              onClick={createBlock}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Létrehozás'}
            </BauhausButton>
          </div>
        </BauhausCard>
      )}

      {/* Blocks list */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <BauhausCard
            key={block.id}
            accentColor={index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'yellow' : 'red'}
          >
            {editingId === block.id ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Megnevezés</label>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => handleChange(block.id, 'title', e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Típus</label>
                  <select
                    value={block.block_type}
                    onChange={(e) => handleChange(block.id, 'block_type', e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  >
                    {blockTypes.map((bt) => (
                      <option key={bt.value} value={bt.value}>
                        {bt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Kezdés</label>
                  <input
                    type="datetime-local"
                    value={block.start_datetime.slice(0, 16)}
                    onChange={(e) => handleChange(block.id, 'start_datetime', e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Vége</label>
                  <input
                    type="datetime-local"
                    value={block.end_datetime.slice(0, 16)}
                    onChange={(e) => handleChange(block.id, 'end_datetime', e.target.value)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Leírás</label>
                  <textarea
                    value={block.description || ''}
                    onChange={(e) => handleChange(block.id, 'description', e.target.value || null)}
                    rows={2}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <BauhausButton
                    onClick={() => {
                      setEditingId(null)
                      loadBlocks()
                    }}
                    variant="default"
                  >
                    Mégse
                  </BauhausButton>
                  <BauhausButton
                    onClick={() => updateBlock(block)}
                    disabled={saving}
                    variant="primary"
                  >
                    {saving ? 'Mentés...' : 'Mentés'}
                  </BauhausButton>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center font-bugrino text-sm"
                    style={{
                      backgroundColor:
                        block.block_type === 'maintenance'
                          ? 'var(--bauhaus-yellow)'
                          : block.block_type === 'internal_event'
                          ? 'var(--bauhaus-blue)'
                          : block.block_type === 'private_booking'
                          ? '#22c55e'
                          : '#e5e7eb'
                    }}
                  >
                    {format(new Date(block.start_datetime), 'd')}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bugrino text-lg uppercase tracking-wider">{block.title}</h3>
                      <BauhausBadge
                        variant={blockTypes.find((bt) => bt.value === block.block_type)?.color || 'outline'}
                      >
                        {blockTypes.find((bt) => bt.value === block.block_type)?.label}
                      </BauhausBadge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(block.start_datetime)} - {formatDateTime(block.end_datetime)}
                    </p>
                    {block.description && (
                      <p className="mt-2 text-sm text-gray-600">{block.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingId(block.id)}
                    className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                  >
                    Szerkesztés
                  </button>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-red)] hover:underline"
                  >
                    Törlés
                  </button>
                </div>
              </div>
            )}
          </BauhausCard>
        ))}
        {blocks.length === 0 && !newBlock && (
          <BauhausCard>
            <div className="py-8 text-center">
              <div
                className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">
                Nincs aktív blokkolás
              </p>
            </div>
          </BauhausCard>
        )}
      </div>
    </div>
  )
}
