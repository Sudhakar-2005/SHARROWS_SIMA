import { cn } from '@/lib/cn'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string; disabled?: boolean }[]
  invalid?: boolean
}

/** Native select, styled to the design system. */
export function Select({ options, className, invalid, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-9 w-full appearance-none rounded-sm border border-line bg-surface-1 px-3 pr-8 text-sm text-ink',
        'transition-colors duration-[140ms] focus:border-accent/50',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        invalid && 'border-neg/50',
        className,
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled} className="bg-surface-2 text-ink">
          {o.label}
        </option>
      ))}
    </select>
  )
}
