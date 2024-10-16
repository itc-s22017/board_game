type Waiting = {
    playerCount: number
    onDismiss: () => void;
};
import { num } from "../utils/gameLogic";

const Waiting = ({ playerCount, onDismiss }: Waiting) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={onDismiss}>
            <div className="animate-bounce bg-white p-10 rounded-lg shadow-xl text-3xl">
            {playerCount} 人が待機中
            あと{num - playerCount}人必要
            </div>
        </div>
    );
};

export default Waiting;