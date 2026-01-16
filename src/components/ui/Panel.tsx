import React from 'react';
import { panelStyles } from './sharedStyles';

type PanelVariant = 'glass' | 'soft' | 'dark';

type PanelProps = {
  variant?: PanelVariant;
  className?: string;
  children: React.ReactNode;
};

const Panel: React.FC<PanelProps> = ({ variant = 'soft', className = '', children }) => {
  return <div className={`${panelStyles[variant]} ${className}`}>{children}</div>;
};

export default Panel;
