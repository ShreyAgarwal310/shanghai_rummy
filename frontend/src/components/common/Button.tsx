import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'icon'

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  'data-a11y-description'?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

function Button({ children, variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  const classes = `ui-button ui-button--${variant} ${className}`.trim()
  const ariaLabel = props['aria-label']
  const providedDescription = props['data-a11y-description']
  const defaultDescription =
    typeof ariaLabel === 'string' ? `${ariaLabel}. Press Enter or Space to activate.` : undefined
  const accessibilityDescription = providedDescription || defaultDescription

  return (
    <button type={type} className={classes} data-a11y-description={accessibilityDescription} {...props}>
      {children}
    </button>
  )
}

export default Button
