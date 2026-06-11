import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import PageMeta from '@/components/page-template/PageMeta'

type Props = {
  title: string
  description: string
  children?: ReactNode
}

export default function PageTemplateSimple({
  title,
  description,
  children,
}: Props) {
  return (
    <>
      <PageMeta
        title={title}
        description={description}
      />

      <div className="rounded-2xl bg-transparent p-0 text-neutral sm:p-1">
        {children ?? <Outlet />}
      </div>
    </>
  )
}
