import avatar from '../img/avatar.png';
import { useEffect, useState } from 'react';
import socket from '../utils/socket';
import { send } from 'process';

// export const Avatar: React.FC<{ playerId: string | null }> = ({ playerId }) => {
//     return (
//         <div
//             className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg ${playerId
//                 ? 'bg-blue-200 border-blue-400'
//                 : 'bg-gray-400 border-gray-600'
//                 }`}
//         >
//             <img
//                 src={avatar.src as string}
//                 alt="Avatar"
//                 className={`w-full h-full object-cover rounded-full ${playerId ? '' : 'opacity-50' // プレイヤーがいない場合は透明度を下げる
//                     }`}
//             />
//         </div>
//     );
// };

// export const Avatar = ({ playerId, currentId = null, roomId }: { playerId: string | null, currentId?: string | null, roomId: string }) => {
//     const [message, setMessage] = useState<string | null>(null);
//     const [fixedPlayerId, setFixedPlayerId] = useState<string | null>(playerId);
//     const presetMessages = ["ナイス！", "もう少し！", "やった！", "次はどうする？"];

//     // 初期化時に`playerId`を固定化
//     useEffect(() => {
//         if (!fixedPlayerId && playerId) {
//             setFixedPlayerId(playerId); // 初回のみ`playerId`を固定
//         }
//     }, [playerId]);

//     useEffect(() => {
//         const handleReceiveMessage = ({ message, senderId }: { message: string, senderId: string }) => {
//             console.log("受信メッセージ:", message);
//             console.log("senderId:", senderId, "playerId:", fixedPlayerId, "currentID::" + currentId);

//             if (currentId === playerId) {
//                 setMessage(message);
//                 setTimeout(() => setMessage(null), 5000);
//             }
//         };

//         socket.on('receiveBubbleMessage', handleReceiveMessage);

//         return () => {
//             socket.off('receiveBubbleMessage', handleReceiveMessage);
//         };
//     }, [fixedPlayerId, currentId]);

//     const handleMessageClick = (message: string) => {
//         console.log(`Sending message: ${message} to room: ${roomId}`);
//         socket.emit('sendBubbleMessage', { roomId, message, currentId });
//         console.log("currentID: " + currentId);
//     };

//     return (
//         <div className="relative">
//             <div
//                 className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg ${fixedPlayerId
//                     ? 'bg-blue-200 border-blue-400'
//                     : 'bg-gray-400 border-gray-600'
//                     }`}
//             >
//                 <img
//                     src={avatar.src as string}
//                     alt="Avatar"
//                     className={`w-full h-full object-cover rounded-full ${fixedPlayerId ? '' : 'opacity-50'}`}
//                 />
//             </div>

//             {message && (
//                 <div className="absolute -top-16 left-10 bg-black text-white text-sm p-6 w-64 max-w-sm rounded-lg shadow-md">
//                     {message}
//                     <div
//                         className="absolute -bottom-2 left-3 w-0 h-0 border-t-[10px] border-t-white 
//                          border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent"
//                     />
//                 </div>
//             )}

//             {/* 定型文ボタン */}
//             {currentId === fixedPlayerId && (
//                 <div className="absolute -bottom-20 left-0 grid grid-cols-2 gap-2 w-40">
//                     {presetMessages.map((msg, index) => (
//                         <button
//                             key={index}
//                             className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
//                             onClick={() => handleMessageClick(msg)}
//                         >
//                             {msg}
//                         </button>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

type ChatProps = {
    playerId: string | null;
    ownId: string;
    chatMessage: string | null;
    onChat: (playerId: string, message: string) => void;
};

const predefinedMessages = ["よろしく！", "ナイス！", "お疲れ様！", "次いくよ！", "何してんの？"];


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
