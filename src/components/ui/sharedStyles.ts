export const tableStyles = {
  wrapper: 'table-area relative w-full h-full',
  frame:
    'absolute inset-4 sm:inset-8 rounded-[140px] p-6 pointer-events-none', // Removed shadows
  surface:
    'w-full h-full rounded-[116px] relative flex items-center justify-center pointer-events-auto', // Removed border
  innerBorder: 'absolute inset-20 border-[2px] border-white/5 rounded-[60px]',
  title:
    'absolute top-6 left-0 right-0 text-center sm:text-left sm:left-10 text-yellow-500/80 font-black uppercase tracking-[0.3em] text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]',
  statusWrap: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-48 z-[40]',
  statusBadge:
    'bg-black/60 backdrop-blur-xl px-10 py-3 rounded-full border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500',
  statusDot: 'w-2 h-2 bg-yellow-500 rounded-full animate-ping',
  statusText:
    'text-yellow-400 font-black tracking-widest text-lg uppercase whitespace-nowrap drop-shadow-md',
  childrenWrap: 'absolute inset-0 p-12 pointer-events-none'
};

export const bottomDock = 'absolute bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none';

export const bottomDockInner = 'max-w-[1400px] mx-auto w-full h-full relative';

export const bottomDockInnerFlex =
  'max-w-[1400px] mx-auto w-full h-full relative flex items-end justify-between';

export const stackCardBase =
  'bg-black/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-1';

export const stackLabel =
  'text-white/40 text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2';

export const stackValueLg = 'text-yellow-500 font-mono font-black text-3xl flex items-center gap-2';

export const stackValueMd = 'text-yellow-500 font-mono font-black text-2xl';

export const mutedPanel =
  'bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-white/60 font-black uppercase tracking-widest';

export const pillPanel =
  'bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 text-white/60 font-black uppercase tracking-widest';

export const seatWrapper = 'absolute flex flex-col items-center';

export const seatCardBase =
  'bg-black/70 border rounded-[24px] px-5 py-4 shadow-2xl min-w-[220px] max-w-[260px]';

export const seatCardActiveBorder = 'border-emerald-400/60';

export const seatCardInactiveBorder = 'border-white/10';

export const seatCardVertical = 'scale-95';

export const seatCardAvatar =
  'w-12 h-12 rounded-full border-2 border-yellow-400/40 object-cover';

export const seatCardName =
  'text-lg font-black text-white truncate whitespace-nowrap max-w-[120px]';

export const seatCardMeta = 'text-[10px] text-white/40 uppercase tracking-widest';

export const seatCardStatValue = 'mt-1 text-emerald-300 font-black text-lg';

export const seatCardLine = 'mt-2 text-xs font-black uppercase tracking-widest';

export const resultCardBase =
  'bg-black/60 border border-yellow-400/20 rounded-[2.5rem] px-8 py-6 shadow-2xl';

export const panelStyles = {
  glass:
    'bg-black/60 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]',
  soft: 'bg-white/5 border border-white/10 rounded-2xl p-4',
  dark: 'bg-black/50 border border-white/10 rounded-[30px] p-6'
};

export const lobbyExitButton = 'uppercase tracking-widest';
