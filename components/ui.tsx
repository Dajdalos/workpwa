'use client'

import { useRef, useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import { Plus, EllipsisVertical } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useT } from '@/lib/i18n'
import LanguageSwitch from '@/components/LanguageSwitch'
import ThemeToggle from '@/components/ThemeToggle'

export function Header({
  userEmail,
  onExport,
  onImport,
  onSearchChange,
  onAddTab,
}: {
  userEmail: string
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
  onSearchChange?: (q: string) => void
  onAddTab?: () => void | Promise<void>
}) {
  const t = useT()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement | null>(null)

  // Profile state
  const [avatar, setAvatar] = useState<string>('')
  const [name, setName] = useState<string>('')

  // Fetch profile
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) return
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name,avatar_url')
        .eq('id', uid)
        .single()
      if (prof) {
        setName(prof.display_name || '')
        setAvatar(prof.avatar_url || '')
      }
    })()
  }, [])

  // Outside click to close menu
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest?.('[data-more-menu]')) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Expose header height via CSS var
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const setH = () => {
      const h = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    setH()
    const ro = new ResizeObserver(setH)
    ro.observe(el)
    window.addEventListener('resize', setH)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', setH)
    }
  }, [])

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-700"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-[1fr_auto] gap-3 items-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-slate-800 dark:text-slate-100 font-semibold tracking-tight">
            Work Hours &amp; Invoices
          </span>

          {/* Search (tabs) */}
          <div className="flex-1 hidden md:flex">
            <input
              type="search"
              placeholder="Search tabs…"
              className="input w-full"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* New tab (compact) */}
          {onAddTab && (
            <button onClick={onAddTab} className="btn" title={t('add_tab')} aria-label={t('add_tab')}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('add_tab')}</span>
            </button>
          )}

          {/* Language + Theme */}
          <LanguageSwitch />
          <ThemeToggle />

          {/* More (backup/restore) */}
          <div className="relative" data-more-menu>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="More"
              aria-label="More"
            >
              <EllipsisVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-56 rounded-xl border bg-white shadow-lg p-1
                           dark:bg-slate-900 dark:border-slate-700"
              >
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    window.location.href = '/profile'
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    onExport()
                  }}
                >
                  Backup (JSON)
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    fileRef.current?.click()
                  }}
                >
                  Restore from file
                </MenuItem>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) await onImport(f)
              if (fileRef.current) fileRef.current.value = ''
            }}
          />

          {/* User pill + logout */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm dark:bg-slate-8 00 dark:text-slate-100">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-300 relative">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name || userEmail || 'User avatar'}
                  fill
                  sizes="24px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs">
                  {(name || userEmail || 'U')[0]}
                </div>
              )}
            </div>
            <span className="hidden sm:inline">{name || userEmail}</span>
          </div>

          <button
            onClick={() => supabase.auth.signOut().then(() => (location.href = '/'))}
            className="btn btn-primary"
          >
            {t('logout') || 'Logout'}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden max-w-6xl mx-auto px-4 pb-3">
        <input
          type="search"
          placeholder="Search tabs…"
          className="input w-full"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm
                  ${disabled ? 'text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800'} 
                  dark:text-slate-100`}
    >
      {children}
    </button>
  )
}

/** FileDropzone (kept here so TabEditor can import from '@/components/ui') */
export function FileDropzone({
  label,
  accept,
  onFiles,
  icon,
}: {
  label: string
  accept: string
  onFiles: (files: File[]) => void
  icon: ReactNode
}) {
  // React's InputHTMLAttributes supports `capture?: boolean | "user" | "environment"`
  const captureProps: { capture?: boolean | 'user' | 'environment' } =
    accept?.includes('image') ? { capture: 'environment' } : {}

  return (
    <label
      className="rounded-2xl border-2 border-dashed p-6 text-center block
                      bg-white dark:bg-slate-900 dark:border-slate-700"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">{icon}</div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Tap to choose files</div>
        <input
          type="file"
          accept={accept}
          multiple
          {...captureProps}
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : []
            if (files.length) onFiles(files)
            ;(e.target as HTMLInputElement).value = ''
          }}
        />
      </div>
    </label>
  )
}
