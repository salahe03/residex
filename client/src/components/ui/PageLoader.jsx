import React from 'react';
import './PageLoader.css';

const PageLoader = ({ title = 'Loading…', subtitle = 'Please wait' }) => {
  return (
    <div className="pl-wrap" aria-busy="true" aria-live="polite">
      <div className="pl-card">
        <div className="pl-ring">
          <div className="pl-core" />
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
};

export default PageLoader;