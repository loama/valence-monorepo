import { clsx } from 'clsx/lite'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { Section } from '../elements/section'

export function Stat({
  stat,
  text,
  className,
  ...props
}: { stat: ReactNode; text: ReactNode } & ComponentProps<'div'>) {
  return (
    <div className={clsx('border-l border-taupe-950/20 pl-6 dark:border-white/20', className)} {...props}>
      <div className="text-2xl/10 tracking-tight text-taupe-950 dark:text-white">{stat}</div>
      <p className="mt-2 text-sm/7 text-taupe-700 dark:text-taupe-400">{text}</p>
    </div>
  )
}

export function StatsWithGraph({ children, ...props }: ComponentProps<typeof Section>) {
  let pathId = useId()

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2 grid grid-cols-2 gap-x-2 gap-y-10 sm:auto-cols-fr sm:grid-flow-col-dense">
          {children}
        </div>
      </div>
      <div className="pointer-events-none relative h-48 sm:h-64 lg:h-36">
        <div className="absolute bottom-0 left-1/2 w-[150vw] max-w-[calc(var(--container-7xl)-(--spacing(10)*2))] -translate-x-1/2">
          <svg
            className="h-100 w-full fill-taupe-950/2.5 stroke-taupe-950/40 dark:fill-white/2.5 dark:stroke-white/40"
            viewBox="0 0 1200 400"
            preserveAspectRatio="none"
          >
            <defs>
              <clipPath id={pathId}>
                <path d="M 0 400 L 0 383 C 396 362.79, 804 264.32, 1200 60 L 1200 60 L 1200 400 Z" />
              </clipPath>
            </defs>
            <path
              d="M 0 400 L 0 383 C 396 362.79, 804 264.32, 1200 60 L 1200 60 L 1200 400 Z"
              stroke="none"
            />
            <g strokeWidth="1" strokeDasharray="4 3" clipPath={`url(#${pathId})`}>
              <line x1="0.5" y1="400" x2="0.5" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="92.31" y1="400" x2="92.31" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="184.62" y1="400" x2="184.62" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="276.92" y1="400" x2="276.92" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="369.23" y1="400" x2="369.23" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="461.54" y1="400" x2="461.54" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="553.85" y1="400" x2="553.85" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="646.15" y1="400" x2="646.15" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="738.46" y1="400" x2="738.46" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="830.77" y1="400" x2="830.77" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="923.08" y1="400" x2="923.08" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="1015.38" y1="400" x2="1015.38" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="1107.69" y1="400" x2="1107.69" y2="0" vectorEffect="non-scaling-stroke" />
              <line x1="1199.5" y1="400" x2="1199.5" y2="0" vectorEffect="non-scaling-stroke" />
            </g>
            <path
              d="M 0 383 C 396 362.79, 804 264.32, 1200 60"
              fill="none"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </Section>
  )
}
