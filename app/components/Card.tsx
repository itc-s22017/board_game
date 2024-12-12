// import React from 'react';
// import Image from 'next/image';
// import tp from "../../public/img/tp.webp"

// interface CardProps {
//     img: string;
//     isFlipped: boolean;
//     onClick: () => void;
// }

// const Card: React.FC<CardProps> = ({ img, isFlipped, onClick }) => {
//     const cardBackImage = tp.src;

//     return (
//         <div
//             className="relative h-24 w-16 cursor-pointer [perspective:1000px]"
//             onClick={onClick}
//         >
//             <div className={`absolute w-full h-full transition-transform duration-300 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
//                 <div className="absolute w-full h-full [backface-visibility:hidden]">
//                     <Image
//                         src={cardBackImage}
//                         alt="Card Back"
//                         fill
//                         className="rounded-lg object-cover"
//                         sizes="64px"
//                     />
//                 </div>
//                 <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
//                     <Image
//                         src={img}
//                         alt="Card Front"
//                         fill
//                         className="rounded-lg object-cover"
//                         sizes="64px"
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Card;

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


