import React from 'react';
import { resultCardBase } from './sharedStyles';

type ResultCardProps = {
  className?: string;
  children: React.ReactNode;
};

const ResultCard: React.FC<ResultCardProps> = ({ className = '', children }) => {
  return <div className={`${resultCardBase} ${className}`}>{children}</div>;
};

export default ResultCard;
