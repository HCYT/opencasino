import React from 'react';

type Variant = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'ghost' | 'muted' | 'light' | 'glass';

type Size =
  | 'pill'
  | 'pillSm'
  | 'pillLg'
  | 'pillXl'
  | 'pillRoundSm'
  | 'squareSm'
  | 'squareMd'
  | 'squareLg'
  | 'sm'
  | 'lg';

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base = 'inline-flex items-center justify-center gap-2 border-0 font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 text-slate-900 border-2 border-amber-200/80 shadow-[0_4px_0_rgba(180,83,9,1),0_8px_20px_rgba(245,158,11,0.6),inset_0_2px_0_rgba(255,255,255,0.5)] active:translate-y-[4px] active:shadow-none hover:brightness-110 tracking-widest',
  success: 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 text-white border-2 border-emerald-300/60 shadow-[0_4px_0_rgba(6,95,70,1),0_8px_20px_rgba(16,185,129,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] active:translate-y-[4px] active:shadow-none hover:brightness-110 tracking-widest',
  danger: 'bg-gradient-to-b from-rose-500 via-red-600 to-red-800 text-white border-2 border-rose-300/60 shadow-[0_4px_0_rgba(153,27,27,1),0_8px_20px_rgba(244,63,94,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] active:translate-y-[4px] active:shadow-none hover:brightness-110 tracking-widest',
  info: 'bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 text-white border-2 border-sky-300/60 shadow-[0_4px_0_rgba(7,89,133,1),0_8px_20px_rgba(14,165,233,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] active:translate-y-[4px] active:shadow-none hover:brightness-110 tracking-widest',
  warning: 'bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 text-white border-2 border-orange-200/60 shadow-[0_4px_0_rgba(154,52,18,1),0_8px_20px_rgba(249,115,22,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] active:translate-y-[4px] active:shadow-none hover:brightness-110 tracking-widest',
  ghost: 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all font-bold tracking-wider',
  muted: 'bg-black/40 text-slate-500 border border-white/5 font-bold tracking-wider',
  light: 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 border-2 border-white shadow-[0_4px_0_rgba(148,163,184,1)] active:translate-y-[4px] active:shadow-none tracking-widest',
  glass: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40 active:scale-95 transition-all shadow-lg backdrop-blur-sm tracking-wider'
};

const sizes: Record<Size, string> = {
  pill: 'px-6 py-4 rounded-2xl',
  pillSm: 'px-3 py-2 rounded-xl',
  pillLg: 'px-10 py-5 rounded-2xl',
  pillXl: 'px-12 py-6 rounded-3xl',
  pillRoundSm: 'px-4 py-2 rounded-full',
  squareSm: 'w-20 h-20 rounded-[1.5rem]',
  squareMd: 'w-24 h-24 rounded-[1.5rem]',
  squareLg: 'w-24 h-24 rounded-[1.8rem]',
  sm: 'px-4 py-2 text-xs rounded-lg',
  lg: 'px-8 py-4 text-lg rounded-xl'
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
