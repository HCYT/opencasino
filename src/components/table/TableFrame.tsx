import React from 'react';
import { tableStyles } from '../ui/sharedStyles';

type TableFrameProps = {
  title?: string;
  statusText?: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
};

const TableFrame: React.FC<TableFrameProps> = ({ title, statusText, children, overlay }) => {
  return (
    <div className={tableStyles.wrapper}>
      <div className={tableStyles.frame}>
        <div className={tableStyles.surface}>
          <div className={tableStyles.innerBorder}></div>
          {title && <div className={tableStyles.title}>{title}</div>}
          {statusText && (
            <div className={tableStyles.statusWrap}>
              <div className={tableStyles.statusBadge}>
                <div className={tableStyles.statusDot}></div>
                <span className={tableStyles.statusText}>{statusText}</span>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
      {overlay && <div className={tableStyles.childrenWrap}>{overlay}</div>}
    </div>
  );
};

export default TableFrame;
