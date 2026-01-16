import React from 'react';
import { stackCardBase, stackLabel, stackValueLg, stackValueMd } from './sharedStyles';

type StackSize = 'lg' | 'md';

type StackCardProps = {
  label: string;
  value: React.ReactNode;
  showPing?: boolean;
  size?: StackSize;
  className?: string;
  children?: React.ReactNode;
};

const StackCard: React.FC<StackCardProps> = ({
  label,
  value,
  showPing = false,
  size = 'lg',
  className = '',
  children
}) => {
  const valueStyle = size === 'md' ? stackValueMd : stackValueLg;

  return (
    <div className={`${stackCardBase} ${className}`}>
      <div className={stackLabel}>
        <span>{label}</span>
        {showPing && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>}
      </div>
      <div className={valueStyle}>{value}</div>
      {children}
    </div>
  );
};

export default StackCard;
