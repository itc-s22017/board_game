import avatar from '../img/avatar.png';

export const Avatar: React.FC<{ playerId: string | null }> = ({ playerId }) => {
    return (
        <div
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg ${playerId
                ? 'bg-blue-200 border-blue-400'
                : 'bg-gray-400 border-gray-600'
                }`}
        >
            <img
                src={avatar.src as string}
                alt="Avatar"
                className={`w-full h-full object-cover rounded-full ${playerId ? '' : 'opacity-50' // プレイヤーがいない場合は透明度を下げる
                    }`}
            />
        </div>
    );
};


