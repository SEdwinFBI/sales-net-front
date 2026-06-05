import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  alt: string
  className?: string
  label?: string
  src: string | null
}

export default function ArticleImage({
  alt,
  className,
  label = 'Sin imagen',
  src,
}: Props) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
        <div className="flex flex-col items-center gap-1 px-2 text-center">
          <ImageOff className="size-5 opacity-60" />
          <span className="text-[11px] font-medium leading-tight">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  )
}
