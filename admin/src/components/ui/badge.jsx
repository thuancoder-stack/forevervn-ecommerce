import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#1f1a17] text-white',
        secondary: 'border-transparent bg-[#f3ece3] text-[#6f6459]',
        outline: 'border-[#e2d7c8] bg-white/80 text-[#6f6459]',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  },
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
