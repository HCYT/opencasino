import React from 'react';

type QuoteBubbleProps = {
  text: string;
  className?: string;
};

const base = 'bg-white text-slate-900 text-xs font-black rounded-xl px-3 py-2 shadow-lg';

const QuoteBubble: React.FC<QuoteBubbleProps> = ({ text, className = '' }) => {
  return <div className={`${base} ${className}`}>{text}</div>;
};

export default QuoteBubble;
