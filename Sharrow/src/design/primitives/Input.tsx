import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const fieldBase = [
  'w-full rounded-sm border border-line bg-surface-1 text-sm text-ink placeholder:text-ink-3',
  'transition-colors duration-[140ms]',
  'focus:border-accent/50 focus:outline-none focus:ring-0',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
  'disabled:pointer-events-none disabled:opacity-50',
]

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Decorative content before the value (icon, currency). */
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, invalid, ...props }, ref) => (
    <div
      className={cn(
        'flex items-center gap-2',
        fieldBase,
        'px-3',
        invalid && 'border-neg/50',
        className,
      )}
    >
      {prefix && <span className="shrink-0 text-ink-3">{prefix}</span>}
      <input
        ref={ref}
        className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-ink-3"
        {...props}
      />
      {suffix && <span className="shrink-0 text-ink-3">{suffix}</span>}
    </div>
  ),
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        fieldBase,
        'min-h-24 resize-y px-3 py-2',
        invalid && 'border-neg/50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

/** Label + control + hint. Every control in SHARROW is labelled. */
export function Field({ label, hint, children, htmlFor, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-ink-3">{hint}</p>}
    </div>
  )
}
