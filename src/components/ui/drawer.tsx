import type { ComponentProps } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'
import { useDesktopMediaQuery } from '@/features/core/hooks/useDesktopMediaQuery'


function Drawer({
  shouldScaleBackground = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
  const { isDesktop, isTablet } = useDesktopMediaQuery()
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={isDesktop || isTablet ? 'right' : "bottom"}
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  )
}

function DrawerTrigger(props: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]', className)}
      {...props}
    />
  )
}

type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content> & {
  overlayClassName?: string
  showHandle?: boolean
}

function DrawerContent({
  className,
  children,
  overlayClassName,
  showHandle = true,
  ...props
}: DrawerContentProps) {
  const { isDesktop, isTablet } = useDesktopMediaQuery()
  return (
    <DrawerPortal >
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          isDesktop || isTablet ?
            'fixed right-0 top-0  z-50  flex min-h-screen max-w-[35vw] flex-col rounded-l-[28px] border border-border/50 bg-background outline-none' :
            'fixed right-0 bottom-0 left-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-[28px] border border-border/50 bg-background outline-none',
          className,
        )}
        {...props}
      >
        {showHandle ? (
          <div
            aria-hidden
            className="mx-auto mt-10 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/25 "
          />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-1.5 px-4 pt-2 pb-4', className)}
      {...props}
    />
  )
}

function DrawerBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-4 pb-4', className)}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex items-center gap-3 border-t border-border/60 px-4 py-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg text-center font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
