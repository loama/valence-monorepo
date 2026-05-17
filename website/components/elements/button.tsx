import Link from 'next/link'

import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

const sizes = {
  md: 'px-3 py-1',
  lg: 'px-4 py-2',
}

export function ButtonLink({
  size = 'md',
  color = 'dark/light',
  className,
  href,
  ...props
}: {
  href: string
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-full text-sm/7 font-medium',
        color === 'dark/light' &&
          'bg-taupe-950 text-white hover:bg-taupe-800 dark:bg-taupe-300 dark:text-taupe-950 dark:hover:bg-taupe-200',
        color === 'light' && 'hover bg-white text-taupe-950 hover:bg-taupe-100 dark:bg-taupe-100 dark:hover:bg-white',
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function SoftButtonLink({
  size = 'md',
  href,
  className,
  ...props
}: {
  href: string
  size?: keyof typeof sizes
} & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-taupe-950/10 text-sm/7 font-medium text-taupe-950 hover:bg-taupe-950/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function PlainButtonLink({
  size = 'md',
  color = 'dark/light',
  href,
  className,
  ...props
}: {
  href: string
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm/7 font-medium',
        color === 'dark/light' && 'text-taupe-950 hover:bg-taupe-950/10 dark:text-white dark:hover:bg-white/10',
        color === 'light' && 'text-white hover:bg-white/15 dark:hover:bg-white/10',
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
