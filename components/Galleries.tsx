'use client'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'

type Item = { id: string; name: string; url: string }

export function ImageGallery({
  items,
  onRemove,
}: {
  items: Item[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((img) => (
        <div key={img.id} className="group relative rounded-xl overflow-hidden border bg-white">
          <div className="relative w-full h-32">
            <Image
              src={img.url}
              alt={img.name || 'image'}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="px-2 py-1 text-[11px] truncate">{img.name}</div>
          <button
            onClick={() => onRemove(img.id)}
            aria-label={`Remove ${img.name}`}
            className="absolute top-1 right-1 p-1.5 rounded-lg bg-white/90 hover:bg-white border opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function PdfGallery({
  items,
  onRemove,
}: {
  items: Item[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((pdf) => (
        <div key={pdf.id} className="group rounded-xl overflow-hidden border bg-white">
          <div className="relative h-48 bg-slate-100">
            <iframe
              src={pdf.url}
              title={pdf.name}
              className="absolute inset-0 w-full h-full"
            />
            <button
              onClick={() => onRemove(pdf.id)}
              aria-label={`Remove ${pdf.name}`}
              className="absolute top-1 right-1 p-1.5 rounded-lg bg-white/90 hover:bg-white border opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          </div>
          <div className="px-2 py-2 text-sm flex items-center justify-between">
            <div className="truncate pr-2">{pdf.name}</div>
            <a href={pdf.url} download className="text-xs underline">
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
