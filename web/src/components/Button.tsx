import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`btn btn--${variant}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
