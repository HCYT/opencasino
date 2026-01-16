import React from 'react';
import { pillPanel } from './sharedStyles';

type PillPanelProps = {
  className?: string;
  children: React.ReactNode;
};

const PillPanel: React.FC<PillPanelProps> = ({ className = '', children }) => {
  return <div className={`${pillPanel} ${className}`}>{children}</div>;
};

export default PillPanel;
