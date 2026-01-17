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
  // Premium Gold - Metallic shine with rich depth
  primary: `
    relative overflow-hidden
    bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600
    text-slate-900 font-black
    border-2 border-amber-300/90
    shadow-[0_6px_0_rgba(146,64,14,1),0_10px_30px_rgba(245,158,11,0.5),inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(180,83,9,0.3)]
    active:translate-y-[6px] active:shadow-[0_0_0_rgba(146,64,14,1),0_4px_15px_rgba(245,158,11,0.4)]
    hover:shadow-[0_6px_0_rgba(146,64,14,1),0_15px_40px_rgba(245,158,11,0.6),inset_0_2px_0_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(180,83,9,0.2)]
    hover:brightness-105
    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
    tracking-widest uppercase
  `.replace(/\s+/g, ' ').trim(),

  // Emerald Success
  success: `
    relative overflow-hidden
    bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700
    text-white font-black
    border-2 border-emerald-300/70
    shadow-[0_5px_0_rgba(6,78,59,1),0_10px_25px_rgba(16,185,129,0.4),inset_0_2px_0_rgba(255,255,255,0.5)]
    active:translate-y-[5px] active:shadow-none
    hover:brightness-110
    tracking-widest uppercase
  `.replace(/\s+/g, ' ').trim(),

  // Rose Danger
  danger: `
    relative overflow-hidden
    bg-gradient-to-b from-rose-400 via-red-500 to-red-700
    text-white font-black
    border-2 border-rose-300/60
    shadow-[0_5px_0_rgba(127,29,29,1),0_10px_25px_rgba(244,63,94,0.4),inset_0_2px_0_rgba(255,255,255,0.4)]
    active:translate-y-[5px] active:shadow-none
    hover:brightness-110
    tracking-widest uppercase
  `.replace(/\s+/g, ' ').trim(),

  // Sky Info
  info: `
    bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700
    text-white font-black
    border-2 border-sky-300/60
    shadow-[0_4px_0_rgba(7,89,133,1),0_8px_20px_rgba(14,165,233,0.5),inset_0_2px_0_rgba(255,255,255,0.4)]
    active:translate-y-[4px] active:shadow-none
    hover:brightness-110
    tracking-widest
  `.replace(/\s+/g, ' ').trim(),

  // Orange Warning
  warning: `
    bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700
    text-white font-black
    border-2 border-orange-200/60
    shadow-[0_4px_0_rgba(154,52,18,1),0_8px_20px_rgba(249,115,22,0.5),inset_0_2px_0_rgba(255,255,255,0.4)]
    active:translate-y-[4px] active:shadow-none
    hover:brightness-110
    tracking-widest
  `.replace(/\s+/g, ' ').trim(),

  // Ghost - Subtle glass effect
  ghost: 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/15 hover:text-white hover:border-amber-400/40 transition-all duration-200 font-bold tracking-wider',

  // Muted
  muted: 'bg-black/40 text-slate-500 border border-white/5 font-bold tracking-wider',

  // Light
  light: 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 border-2 border-white shadow-[0_4px_0_rgba(148,163,184,1)] active:translate-y-[4px] active:shadow-none tracking-widest',

  // Glass - Premium translucent
  glass: `
    bg-white/10 backdrop-blur-md
    text-white font-bold
    border border-white/20
    shadow-lg
    hover:bg-white/20 hover:border-amber-400/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
    active:scale-95
    transition-all duration-200
    tracking-wider
  `.replace(/\s+/g, ' ').trim()
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
