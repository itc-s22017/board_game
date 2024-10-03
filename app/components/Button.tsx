import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;  
}

const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return (
    <button 
      className="w-40 p-4 bg-blue-500 rounded-md mx-2 text-white text-center"
      onClick={onClick}  
    >
      {text}
    </button>
  );
}

export default Button;
