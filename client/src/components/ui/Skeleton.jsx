import React from 'react';
import './skeleton.css';

const Skeleton = ({ className = '', style }) => (
  <div className={`skel ${className}`} style={style} />
);

export default Skeleton;