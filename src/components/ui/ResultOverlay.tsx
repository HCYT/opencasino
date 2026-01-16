import React from 'react';

type ResultOverlayProps = {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
  children: React.ReactNode;
};

const ResultOverlay: React.FC<ResultOverlayProps> = ({
  title,
  subtitle,
  titleClassName = '',
  subtitleClassName = '',
  className = '',
  children
}) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px] flex items-center justify-center z-50 pointer-events-none">
      <div className={`text-center animate-in fade-in zoom-in duration-700 ${className}`}>
        <h2 className={titleClassName}>{title}</h2>
        {subtitle && <div className={subtitleClassName}>{subtitle}</div>}
        {children}
      </div>
    </div>
  );
};

export default ResultOverlay;
