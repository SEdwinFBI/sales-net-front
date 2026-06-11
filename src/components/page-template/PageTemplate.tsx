import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import PageMeta from '@/components/page-template/PageMeta'
import PageTabs, { type PageTabItem } from '@/components/page-template/PageTabs'

type props = {
  title: string
  description: string
  tabs?: PageTabItem[]
  children?: ReactNode
}

export default function PageTemplate({
  title,
  description,
  tabs = [],
  children,
}: props) {
  return (
    <>
      <PageMeta
        title={title}
        description={description}
      />

      <div className="rounded-2xl bg-transparent p-0 text-neutral sm:p-1">
        <PageTabs tabs={tabs} />
        {children ?? <Outlet />}
      </div>
    </>
  )
}
