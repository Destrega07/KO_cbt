import React from 'react';
import cocaColaCapImage from '../assets/images/coca-cola-cap.png';

const CocaColaBottleCap = ({ size = 48 }) => {
  return (
    <img
      src={cocaColaCapImage}
      alt="Coca-Cola"
      width={size}
      height={size}
      className="inline-block"
      style={{ objectFit: 'contain' }}
    />
  );
};

export default CocaColaBottleCap;