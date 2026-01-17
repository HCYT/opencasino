import React from 'react';
import { tableStyles } from '../ui/sharedStyles';
import CasinoTable3D from './CasinoTable3D';

type TableFrameProps = {
  title?: string;
  statusText?: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  themeColor?: string; // New prop for table felt color
};

const TableFrame: React.FC<TableFrameProps> = ({ title, statusText, children, overlay, themeColor }) => {
  return (
    <div className={tableStyles.wrapper}>
      {/* 3D Background Layer */}
      <CasinoTable3D color={themeColor} />

      <div className={tableStyles.frame}>
        {/* Remove the old CSS background/surface styles, make it transparent container */}
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Inner border can be kept for UI safe area guide, or removed if it clashes */}
          {/* <div className={tableStyles.innerBorder}></div> */}

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
