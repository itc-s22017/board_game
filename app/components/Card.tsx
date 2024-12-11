import React from 'react';
import Image from 'next/image';

interface CardProps {
    img: string;
    isFlipped: boolean;
    onClick: () => void;
}

const Card: React.FC<CardProps> = ({ img, isFlipped, onClick }) => {
    return (
        <div
            className={`relative h-24 w-16 cursor-pointer transition-transform duration-300 ease-in-out ${isFlipped ? 'rotate-y-180' : ''
                }`}
            onClick={onClick}
        >
            <div className="absolute h-full w-full rounded-lg shadow-md transition-all duration-300">
                <div
                    className={`absolute backface-hidden h-full w-full rounded-lg border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 ${isFlipped ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    <div className="flex h-full items-center justify-center">
                        <span className="text-2xl font-bold text-white">?</span>
                    </div>
                </div>
                <div
                    className={`absolute backface-hidden h-full w-full overflow-hidden rounded-lg ${isFlipped ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                   <Image
                        src={img}
                        alt="Card"
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
};

export default Card;

