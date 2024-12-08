import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { p } from 'framer-motion/client';

interface AvatarProps {
    playerId: string;
    ownId: string;
    onChat: (playerId: string, message: string) => void;
    chatMessage: string | null;
    isCurrentPlayer: boolean;
}

const presetMessages = [
    "よろしくお願いします",
    "いい勝負でした",
    "ナイス！",
    "残念...",
    "考え中です",
];

const SantaHat = () => (
    <svg
        className="absolute -top-9 left-1/2 transform -translate-x-1/2"
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M10 80 Q50 20 90 80 L50 90 Z" fill="#ff0000" />
        <circle cx="90" cy="80" r="10" fill="#ffffff" />
        <rect x="0" y="80" width="100" height="20" fill="#ffffff" />
    </svg>
);

export const Avatar: React.FC<AvatarProps> = ({ playerId, ownId, onChat, chatMessage, isCurrentPlayer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const firstLetter = playerId.charAt(0).toUpperCase();

    const handleClick = () => {
        if (playerId === ownId) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelectMessage = (message: string) => {
        onChat(playerId, message);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {isCurrentPlayer && <SantaHat />}
            <motion.div
                className={`w-16 h-16 rounded-full overflow-hidden cursor-pointer flex items-center justify-center text-2xl font-bold ${playerId === ownId ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                    }`}
                onClick={handleClick}
                animate={isCurrentPlayer ? {
                    scale: [1, 1.1, 1],
                    transition: {
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }
                } : {}}
            >
                {firstLetter}
            </motion.div>
            {playerId === ownId  && <strong>あなた</strong>}
            {chatMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-full ml-2 bg-black p-2 rounded-lg shadow-md w-48 overflow-hidden whitespace-nowrap text-ellipsis"
                >
                    <div className='text-white'>
                        {chatMessage}
                    </div>
                </motion.div>
            )}
            {isOpen && playerId === ownId && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-md z-10"
                >
                    {presetMessages.map((message, index) => (
                        <motion.button
                            key={index}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                            onClick={() => handleSelectMessage(message)}
                            whileHover={{ backgroundColor: "#f3f4f6" }}
                        >
                            {message}
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

