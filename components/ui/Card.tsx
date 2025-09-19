import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  // Fix: Add optional onClick prop to make card clickable.
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions, onClick }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`} onClick={onClick}>
      {(title || actions) && (
        <div className="p-4 border-b flex justify-between items-center">
          {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
