import React from 'react';

type ModalOverlayProps = {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

const baseContent = 'bg-black/80 border border-white/10 rounded-[2rem] p-8 text-white';

const ModalOverlay: React.FC<ModalOverlayProps> = ({
  className = '',
  contentClassName = '',
  children
}) => {
  return (
    <div
      className={`absolute inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[90] pointer-events-auto ${className}`}
    >
      <div className={`${baseContent} ${contentClassName}`}>{children}</div>
    </div>
  );
};

export default ModalOverlay;
