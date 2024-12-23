import React from 'react';
import { num } from "../utils/gameLogic";

type Waiting = {
    playerCount: number
    onDismiss: () => void;
};

const Waiting = ({ playerCount, onDismiss }: Waiting) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center" onClick={onDismiss}>
            <div className="animate-bounce p-10 rounded-lg shadow-xl text-3xl text-white font-bold border-4 border-dashed border-green-500 relative backdrop-blur-sm">
                <div className="absolute inset-0 border-4 border-dotted border-red-500 animate-pulse"></div>
                🎄 {playerCount} 人が待機中 🎅
                <br />
                あと {num - playerCount} 人必要
            </div>
        </div>
    );
};

export default Waiting;