'use client'
import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ChatPanel from './ChatPanel'
import clsx from 'clsx'

export default function ChatDock({
  workspaceId,
  currentUserId,
  tabId,             // optional: pass to scope chat per tab
  defaultOpen = false,
}: {
  workspaceId: string
  currentUserId: string
  tabId?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    const saved = localStorage.getItem('chat:open')
    if (saved !== null) setOpen(saved === '1')
  }, [])
  useEffect(() => {
    localStorage.setItem('chat:open', open ? '1' : '0')
  }, [open])

  return (
    <>
      {/* Toggle button (FAB) */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'fixed z-50 bottom-4 right-4 rounded-full shadow-lg border',
          'bg-white text-slate-800 hover:bg-slate-50',
          'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
          'w-12 h-12 grid place-items-center'
        )}
        aria-label={open ? 'Close chat' : 'Open chat'}
        title={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Floating chat window */}
      {open && (
        <div
          className={clsx(
            'fixed z-50 bottom-20 right-4',
            // responsive size
            'w-[min(92vw,380px)] h-[min(70vh,560px)]',
            'rounded-2xl border shadow-xl overflow-hidden',
            'bg-white text-slate-800',
            'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700'
          )}
        >
          <ChatPanel
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            tabId={tabId}
            className="h-full"     // fill the window
          />
        </div>
      )}
    </>
  )
}
