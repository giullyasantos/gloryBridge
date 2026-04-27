import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'blank-toggle' | 'logo-toggle'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  active?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold focus:ring-brand-400',
  secondary:
    'bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 font-medium focus:ring-slate-500',
  danger:
    'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold focus:ring-red-400',
  ghost:
    'bg-transparent hover:bg-slate-800 active:bg-slate-700 text-slate-400 hover:text-slate-100 focus:ring-slate-500',
  'blank-toggle':
    'bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700 font-semibold focus:ring-red-500',
  'logo-toggle':
    'bg-slate-800 hover:bg-yellow-900/60 text-slate-300 hover:text-yellow-300 border border-slate-700 hover:border-yellow-700 font-semibold focus:ring-yellow-500'
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
  xl: 'px-6 py-3 text-lg rounded-xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', active, fullWidth, className = '', children, ...props }, ref) => {
    const activeClass =
      active && variant === 'blank-toggle'
        ? '!bg-red-700 !text-white !border-red-600'
        : active && variant === 'logo-toggle'
          ? '!bg-yellow-700 !text-white !border-yellow-600'
          : active
            ? 'ring-2 ring-brand-400'
            : ''

    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center gap-2 transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          activeClass,
          className
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
