import Cell from './Cell';
import { BoardState } from '../utils/gameLogic';

type BoardProps = {
    board: BoardState;
    onCellClick: (row: number, col: number) => void;
};

// ボードを表すコンポーネント
const Board = ({ board, onCellClick }: BoardProps) => {
    return (
        <div className="grid grid-cols-8 grid-rows-8 mx-auto" style={{ width: '320px', height: '320px' }}>
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <Cell key={`${rowIndex}-${colIndex}`} value={cell} onClick={() => onCellClick(rowIndex, colIndex)} />
                ))
            )}
        </div>
    );
};

export default Board;