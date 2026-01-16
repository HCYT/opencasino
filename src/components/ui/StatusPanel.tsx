import React from 'react';
import { mutedPanel } from './sharedStyles';

type StatusPanelProps = {
  className?: string;
  children: React.ReactNode;
};

const StatusPanel: React.FC<StatusPanelProps> = ({ className = '', children }) => {
  return <div className={`${mutedPanel} ${className}`}>{children}</div>;
};

export default StatusPanel;
