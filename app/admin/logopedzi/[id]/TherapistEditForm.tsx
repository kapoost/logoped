'use client'
// app/admin/logopedzi/[id]/TherapistEditForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LICENSE_OPTIONS = [
  { value: 'trial',     label: 'Trial (3 pac.)',      days: 30 },
  { value: 'basic',     label: 'Basic (10 pac.)',     days: 365 },
  { value: 'pro',       label: 'Pro (30 pac.)',       days: 365 },
  { value: 'unlimited', label: 'Unlimited (∞ pac.)', days: 365 },
]

const MAX_PATIENTS: Record<string, number> = {
  trial: 3, basic: 10, pro: 30, unlimited: 9999,
}

interface Props {
  profile: Record<string, any>
}

export default function TherapistEditForm({ profile }: Props) {
  const router = useRouter()
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [form, setForm] = useState({
    full_name:           profile.full_name ?? '',
    organization:        profile.organization ?? '',
    phone:               profile.phone ?? '',
    notes:               profile.notes ?? '',
    license_type:        profile.license_type ?? 'trial',
    license_expires_at:  profile.license_expires_at
      ? new Date(profile.license_expires_at).toISOString().slice(0, 10)
      : '',
    max_patients:        profile.max_patients ?? 5,
    is_blocked:          profile.is_blocked ?? false,
    block_reason:        profile.block_reason ?? '',
    new_password:        '',
  })

  function field(key: keyof typeof form, val: any) {
    setForm(f => ({ ...f, [key]: val }))
    // Auto-aktualizuj max_patients przy zmianie licencji
    if (key === 'license_type') {
      setForm(f => ({ ...f, license_type: val, max_patients: MAX_PATIENTS[val] ?? 5 }))
    }
  }

  function extendLicense(days: number) {
    const base = form.license_expires_at && new Date(form.license_expires_at) > new Date()
      ? new Date(form.license_expires_at)
      : new Date()
    const extended = new Date(base)
    extended.setDate(extended.getDate() + days)
    setForm(f => ({ ...f, license_expires_at: extended.toISOString().slice(0, 10) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const res = await fetch(`/api/admin/update-therapist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profile.id, ...form }),
    })

    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Zapisano zmiany.' })
      router.refresh()
    } else {
      setMsg({ type: 'err', text: data.error ?? 'Błąd zapisu.' })
    }
  }


  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
      <h2 className="text-sm font-semibold text-gray-700">Edytuj profil</h2>

      {/* DANE OSOBOWE */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dane osobowe</div>

        <div>
          <label className="text-xs text-gray-600 font-medium">Imię i nazwisko</label>
          <input value={form.full_name} onChange={e => field('full_name', e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Organizacja / gabinet</label>
            <input value={form.organization} onChange={e => field('organization', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Telefon</label>
            <input value={form.phone} onChange={e => field('phone', e.target.value)} type="tel"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 font-medium">Notatki (widoczne tylko dla admina)</label>
          <textarea value={form.notes} onChange={e => field('notes', e.target.value)} rows={2}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"/>
        </div>
      </div>

      {/* LICENCJA */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Licencja</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Typ licencji</label>
            <select value={form.license_type} onChange={e => field('license_type', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
              {LICENSE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Maks. pacjentów</label>
            <input value={form.max_patients} onChange={e => field('max_patients', parseInt(e.target.value))}
              type="number" min={1} max={9999}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 font-medium">Data wygaśnięcia licencji</label>
          <input value={form.license_expires_at} onChange={e => field('license_expires_at', e.target.value)}
            type="date"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
        </div>

        <div className="flex gap-2">
          {[
            { label: '+30 dni', d: 30 },
            { label: '+3 mies.', d: 90 },
            { label: '+1 rok', d: 365 },
          ].map(({ label, d }) => (
            <button key={d} type="button" onClick={() => extendLicense(d)}
              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* BLOKADA */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status konta</div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-5 rounded-full transition-colors ${form.is_blocked ? 'bg-red-500' : 'bg-gray-200'}`}
            onClick={() => field('is_blocked', !form.is_blocked)}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_blocked ? 'translate-x-5' : 'translate-x-0.5'}`}/>
          </div>
          <span className={`text-sm font-medium ${form.is_blocked ? 'text-red-600' : 'text-gray-600'}`}>
            {form.is_blocked ? 'Konto zablokowane' : 'Konto aktywne'}
          </span>
        </label>

        {form.is_blocked && (
          <div>
            <label className="text-xs text-gray-600 font-medium">Powód blokady</label>
            <input value={form.block_reason} onChange={e => field('block_reason', e.target.value)}
              placeholder="Wpisz powód..."
              className="mt-1 w-full px-3 py-2 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
          </div>
        )}
      </div>

      {/* HASŁO */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hasło</div>

        <div>
          <label className="text-xs text-gray-600 font-medium">Nowe hasło (opcjonalne)</label>
          <input value={form.new_password} onChange={e => field('new_password', e.target.value)}
            type="password" placeholder="min. 8 znaków"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
        </div>

      </div>

      {/* MSG */}
      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-xl font-medium ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {/* SAVE */}
      <button type="submit" disabled={saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
        {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
      </button>
    </form>
  )
}
