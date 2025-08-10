'use client'
import type { ElementType, ComponentPropsWithoutRef } from 'react'
import { useT } from '@/lib/i18n'

type Vars = Record<string, string | number>

type TransProps<T extends ElementType = 'span'> = {
  k: string
  vars?: Vars
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>

export default function Trans<T extends ElementType = 'span'>({
  k,
  vars,
  as,
  className,
  ...rest
}: TransProps<T>) {
  const t = useT()
  const Tag = (as ?? 'span') as ElementType
  return (
    <Tag className={className} {...rest}>
      {t(k, vars)}
    </Tag>
  )
}
