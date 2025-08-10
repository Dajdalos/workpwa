'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { EntryRow, Role, Tab } from '@/lib/types'
import HoursTable from '@/components/HoursTable'
import RolesCard from '@/components/RolesCard'
import Analytics from '@/components/Analytics'
import { FileDropzone } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { Image as ImageIcon, FileText, ExternalLink, Trash2 } from 'lucide-react'

type EditorProps = {
  tab: Tab
  onSave: (t: Tab) => void
  onUploadImages: (files: File[]) => void | Promise<void>
  onUploadPdfs: (files: File[]) => void | Promise<void>
  imageItems: { id: string; name: string; url: string }[]
  pdfItems: { id: string; name: string; url: string }[]
  onRemoveImage: (name: string) => void | Promise<void>
  onRemovePdf: (name: string) => void | Promise<void>
}

export default function TabEditor({
  tab,
  onSave,
  onUploadImages,
  onUploadPdfs,
  imageItems,
  pdfItems,
  onRemoveImage,
  onRemovePdf,
}: EditorProps) {
  const t = useT()

  // Local state (re-init only when switching tab id)
  const [name, setName] = useState(tab.name || '')
  const [entries, setEntries] = useState<EntryRow[]>(tab.entries || [])
  const [roles, setRoles] = useState<Role[]>(
    tab.roles?.length ? tab.roles : [{ id: crypto.randomUUID(), name: t('default_role'), rate: 0 }]
  )
  const [invoice, setInvoice] = useState<string>(tab.invoice || '')
  const [notes, setNotes] = useState<string>(tab.notes || '')

  const prevTabId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (prevTabId.current !== tab.id) {
      setName(tab.name || '')
      setEntries(Array.isArray(tab.entries) ? tab.entries : [])
      setRoles(
        tab.roles?.length ? tab.roles : [{ id: crypto.randomUUID(), name: t('default_role'), rate: 0 }]
      )
      setInvoice(tab.invoice || '')
      setNotes(tab.notes || '')
      prevTabId.current = tab.id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  // Derived totals
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0),
    [entries]
  )

  // Autosave (hours = sum(entries))
  useEffect(() => {
    onSave({ ...tab, name, hours: totalHours, entries, roles, invoice, notes })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, entries, roles, invoice, notes, totalHours])

  return (
    <div className="space-y-4">
      {/* Month name */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
        <label className="text-xs text-slate-600 dark:text-slate-300">{t('tab_month_name')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-700"
          placeholder={t('month_placeholder')}
        />
      </div>

      {/* Roles & rates (pro) */}
      <RolesCard roles={roles} setRoles={setRoles} entries={entries} setEntries={setEntries} />

      {/* Uploads */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Images */}
        <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
          <div className="text-sm font-medium mb-3">{t('images')}</div>

          <FileDropzone
            label={t('upload_images')}
            accept="image/*"
            onFiles={onUploadImages}
            icon={<ImageIcon className="w-5 h-5" />}
          />

          {imageItems.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageItems.map((it) => (
                <div
                  key={it.id}
                  className="relative group rounded-xl overflow-hidden border dark:border-slate-700"
                >
                  <a
                    href={it.url}
                    target="_blank"
                    className="block relative h-36"
                    rel="noreferrer"
                    title={it.name}
                  >
                    <Image
                      src={it.url}
                      alt={it.name || 'image'}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </a>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md bg-white/80 dark:bg-slate-900/80 border dark:border-slate-700"
                      title={t('open') || 'Open'}
                      aria-label={t('open') || 'Open'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onRemoveImage(it.name)}
                      className="p-1.5 rounded-md bg-white/80 dark:bg-slate-900/80 border dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      title={t('remove')}
                      aria-label={t('remove')}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDFs / Invoices */}
        <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
          <div className="text-sm font-medium mb-3">{t('invoices')}</div>

          <FileDropzone
            label={t('upload_pdfs')}
            accept="application/pdf"
            onFiles={onUploadPdfs}
            icon={<FileText className="w-5 h-5" />}
          />

          {pdfItems.length > 0 && (
            <ul className="mt-4 space-y-3">
              {pdfItems.map((it) => (
                <li key={it.id} className="rounded-xl border dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800">
                    <div className="truncate text-sm">{it.name}</div>
                    <div className="flex items-center gap-2">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md bg-white dark:bg-slate-900 border dark:border-slate-700"
                        title={t('open') || 'Open'}
                        aria-label={t('open') || 'Open'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onRemovePdf(it.name)}
                        className="p-1.5 rounded-md bg-white dark:bg-slate-900 border dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title={t('remove')}
                        aria-label={t('remove')}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </div>
                  {/* small preview pane */}
                  <div className="h-48 bg-white dark:bg-slate-900">
                    <iframe src={it.url} className="w-full h-full" title={it.name} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Daily entries */}
      <HoursTable entries={entries} roles={roles} onChange={setEntries} />

      {/* Invoice + Notes */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
        <label className="text-xs text-slate-600 dark:text-slate-300">{t('invoice_hint')}</label>
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-700"
          placeholder={t('invoice_placeholder')}
        />
        <div className="mt-2">
          <label className="text-xs text-slate-600 dark:text-slate-300">{t('notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-700"
            rows={3}
            placeholder={t('notes_placeholder')}
          />
        </div>
      </div>

      {/* Analytics */}
      <Analytics entries={entries} roles={roles} monthName={name} />
    </div>
  )
}
