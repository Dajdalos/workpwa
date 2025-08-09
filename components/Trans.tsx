'use client'
import { useT } from '@/lib/i18n'

export default function Trans({
  k, vars, as: Tag = 'span', className,
}: { k: string; vars?: Record<string, any>; as?: any; className?: string }) {
  const t = useT()
  return <Tag className={className}>{t(k, vars)}</Tag>
}
