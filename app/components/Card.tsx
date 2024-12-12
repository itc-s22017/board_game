import React from 'react';
import Image from 'next/image';
import tp from "../../public/img/tp.webp"

interface CardProps {
    img: string;
    isFlipped: boolean;
    onClick: () => void;
}

const Card: React.FC<CardProps> = ({ img, isFlipped, onClick }) => {
    const cardBackImage = tp.src;

    return (
        <div
            className="relative h-24 w-16 cursor-pointer [perspective:1000px]"
            onClick={onClick}
        >
            <div className={`absolute w-full h-full transition-transform duration-300 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden]">
                    <Image
                        src={cardBackImage}
                        alt="Card Back"
                        fill
                        className="rounded-lg object-cover"
                        sizes="64px"
                    />
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <Image
                        src={img}
                        alt="Card Front"
                        fill
                        className="rounded-lg object-cover"
                        sizes="64px"
                    />
                </div>
            </div>
        </div>
    );
};

export default Card;

