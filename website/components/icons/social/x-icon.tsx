import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function XIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path d="M13.68 10.62L20.24 3H18.69L12.99 9.62L8.45 3H3.2L10.08 13.01L3.2 21H4.76L10.77 14.01L15.57 21H20.81L13.68 10.62ZM11.56 13.1L10.86 12.1L5.31 4.17H7.7L12.18 10.57L12.87 11.57L18.69 19.88H16.3L11.56 13.1Z" />
    </svg>
  )
}
