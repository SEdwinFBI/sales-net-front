import { Card } from '@/components/ui/card'

export default function ClienteCardSkeleton() {
  return (
    <Card className="animate-pulse bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="mt-2 h-5 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="size-6 rounded bg-muted" />
          <div className="size-6 rounded bg-muted" />
        </div>
      </div>
    </Card>
  )
}
