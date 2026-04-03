import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1f1a17]/20',
  {
    variants: {
      variant: {
        default: 'bg-[#1f1a17] text-white shadow-[0_14px_30px_rgba(31,26,23,0.18)] hover:bg-[#2a221d]',
        secondary: 'border border-[#e7ddcf] bg-white text-[#2b241f] shadow-sm hover:bg-[#faf6f0]',
        ghost: 'text-[#6f6459] hover:bg-[#f7efe6] hover:text-[#1f1a17]',
        premium: 'border border-[#dfcfbc] bg-[#f8f1e8] text-[#1f1a17] shadow-[0_10px_24px_rgba(31,26,23,0.06)] hover:bg-[#f3e8da]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-xl px-3',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
