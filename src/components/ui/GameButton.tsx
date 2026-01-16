import React from 'react';

type Variant = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'ghost' | 'muted' | 'light';

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const base = 'font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-900 shadow-xl',
  success: 'bg-emerald-600 text-white shadow-lg',
  danger: 'bg-red-600 text-white shadow-lg',
  info: 'bg-blue-600 text-white shadow-lg',
  warning: 'bg-amber-500 text-white shadow-lg',
  ghost: 'bg-black/50 border border-white/10 text-white/70 hover:text-white hover:border-white/40',
  muted: 'bg-black/60 backdrop-blur-md border border-white/10 text-white/60',
  light: 'bg-white text-slate-900 shadow-xl'
};

export const GameButton: React.FC<GameButtonProps> = ({
  variant = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
    />
  );
};
