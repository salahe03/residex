import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

const SkeletonTable = ({ rows = 8, cols = 5, title = 'Loading…' }) => {
  const arr = Array.from({ length: rows });
  const carr = Array.from({ length: cols });
  return (
    <div className="skel-card">
      <div className="skel-card-header">
        <Skeleton className="skel-title" />
        <Skeleton className="skel-chip" />
      </div>
      <div className="skel-table">
        <div className="skel-thead">
          {carr.map((_, i) => <Skeleton key={i} className="skel-th" />)}
        </div>
        <div className="skel-tbody">
          {arr.map((_, r) => (
            <div className="skel-tr" key={r}>
              {carr.map((__, c) => (
                <Skeleton key={c} className={`skel-td ${c === 0 ? 'w-40' : c === cols - 1 ? 'w-16' : 'w-20'}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="skel-footer">
        <Skeleton className="skel-pill" />
        <Skeleton className="skel-pill" />
      </div>
    </div>
  );
};

export default SkeletonTable;