import React from 'react';

type ToastBannerProps = {
  className?: string;
  children: React.ReactNode;
};

const base =
  'absolute top-6 left-1/2 -translate-x-1/2 z-[80] bg-black/70 border border-white/10 px-6 py-3 rounded-full text-sm text-white/80 font-black';

const ToastBanner: React.FC<ToastBannerProps> = ({ className = '', children }) => {
  return <div className={`${base} ${className}`}>{children}</div>;
};

export default ToastBanner;
