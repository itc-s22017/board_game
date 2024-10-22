import React from 'react';
import trumpUra from '../img/trump_ura.jpg';

type CardProps = {
    img: string;
    isFlipped: boolean;
    onClick: () => void;
};

const Card = ({ img, isFlipped, onClick }: CardProps) => {
    return (
        <div
            className={`w-36 h-42 m-2 border-2 border-gray-400 flex items-center justify-center cursor-pointer transform transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''
                }`}
            onClick={onClick}
        >
            {isFlipped ? (
                <img src={img} alt="card" className="w-full h-full object-cover" />
            ) : (
                <img src={trumpUra.src} alt="card" className="w-full h-full object-cover" />
            )}
        </div>
    );
};

export default Card;
