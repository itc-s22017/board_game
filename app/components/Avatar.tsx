import avatar from '../img/avatar.png';
import { useEffect, useState } from 'react';
import socket from '../utils/socket';
import { send } from 'process';

type ChatProps = {
    playerId: string | null;
    ownId: string;
    chatMessage: string | null;
    onChat: (playerId: string, message: string) => void;
};

const predefinedMessages = ["よろしく！", "ナイス！", "お疲れ様！", "WTF!", "何してんの？"];


export const Avatar: React.FC<ChatProps> = ({ playerId, ownId, chatMessage, onChat }) => {
    const [showMessageMenu, setShowMessageMenu] = useState(false);

    const isOwnAvatar = playerId === ownId;

    const handleSelectMessage = (message: string) => {
        if (playerId) {
            onChat(playerId, message);
            setShowMessageMenu(false);
        }
    };

    return (
        <div className="relative text-center">
            {/* アバター */}
            <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg cursor-pointer ${playerId ? 'bg-blue-200 border-blue-400' : 'bg-gray-400 border-gray-600'
                    }`}
                onClick={() => isOwnAvatar && setShowMessageMenu((prev) => !prev)}
            >
                <img
                    src={avatar.src as string}
                    alt="Avatar"
                    className={`w-full h-full object-cover rounded-full ${playerId ? '' : 'opacity-50'}`}
                />
            </div>

            {isOwnAvatar && (
                <div className="text-xs text-gray-500 mt-2">あなた</div>
            )}

            {/* 吹き出し */}
            {chatMessage && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-white border border-gray-300 shadow-md p-2 rounded text-sm max-w-1200 z-10 whitespace-nowrap">
                    {chatMessage}
                </div>
            )}


            {/* 定型文メニュー */}
            {showMessageMenu && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-lg p-2 w-40">
                    <ul className="space-y-2">
                        {predefinedMessages.map((message, index) => (
                            <li
                                key={index}
                                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                                onClick={() => handleSelectMessage(message)}
                            >
                                {message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
