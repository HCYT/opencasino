import React from 'react';

type Variant = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'ghost' | 'muted' | 'light';

type Size =
  | 'pill'
  | 'pillSm'
  | 'pillLg'
  | 'pillXl'
  | 'pillRoundSm'
  | 'squareSm'
  | 'squareMd'
  | 'squareLg';

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base = 'inline-flex items-center justify-center gap-2 border-0 font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-500 text-slate-900 shadow-[0_0_40px_rgba(255,214,102,0.65),0_12px_24px_rgba(0,0,0,0.35)] hover:brightness-110',
  success: 'bg-gradient-to-b from-emerald-300 to-emerald-700 text-white shadow-[0_0_34px_rgba(16,185,129,0.55),0_10px_22px_rgba(0,0,0,0.3)] hover:brightness-110',
  danger: 'bg-gradient-to-b from-rose-400 to-red-700 text-white shadow-[0_0_34px_rgba(248,113,113,0.55),0_10px_22px_rgba(0,0,0,0.3)] hover:brightness-110',
  info: 'bg-gradient-to-b from-sky-300 to-indigo-700 text-white shadow-[0_0_34px_rgba(96,165,250,0.55),0_10px_22px_rgba(0,0,0,0.3)] hover:brightness-110',
  warning: 'bg-gradient-to-b from-amber-200 to-orange-500 text-slate-900 shadow-[0_0_32px_rgba(251,191,36,0.55),0_10px_22px_rgba(0,0,0,0.3)] hover:brightness-110',
  ghost: 'bg-black/45 text-white/75 shadow-none hover:text-white hover:bg-black/60',
  muted: 'bg-black/55 text-white/60 shadow-none hover:text-white/85 hover:bg-black/70',
  light: 'bg-gradient-to-b from-white via-slate-50 to-slate-200 text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.2)] hover:brightness-105'
};

const sizes: Record<Size, string> = {
  pill: 'px-6 py-4 rounded-2xl',
  pillSm: 'px-3 py-2 rounded-xl',
  pillLg: 'px-10 py-5 rounded-2xl',
  pillXl: 'px-12 py-6 rounded-3xl',
  pillRoundSm: 'px-4 py-2 rounded-full',
  squareSm: 'w-20 h-20 rounded-[1.5rem]',
  squareMd: 'w-24 h-24 rounded-[1.5rem]',
  squareLg: 'w-24 h-24 rounded-[1.8rem]'
};

export const GameButton: React.FC<GameButtonProps> = ({
  variant = 'primary',
  size,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${size ? sizes[size] : ''} ${className}`}
    />
  );
};
