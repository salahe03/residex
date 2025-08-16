import React from 'react';
import './PageLoader.css';

const PageLoader = ({ title = 'Loading Residex…', subtitle = 'Preparing your dashboard' }) => {
  return (
    <div className="pl-wrap">
      <div className="pl-card">
        <div className="pl-ring">
          <div className="pl-core" />
        </div>
        <div className="pl-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
};

export default PageLoader;