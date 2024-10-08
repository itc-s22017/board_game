import { CellValue } from "../utils/gameLogic"

type CellProps = {
    value: CellValue;
    onClick: () => void;
};

const Cell = ({ value, onClick }: CellProps) => {
    const cellStyle = `flex justify-center items-center w-10 h-10 border border-gray-800`;
    const stoneStyle = `rounded-full ${value === 'black' ? 'bg-black' : 'bg-white'} `;
    const hasStone = value === 'black' || value === 'white';

    return (
        <div
            onClick={onClick}
            className={`${cellStyle} bg-green-400`}
            style={{ width: '40px', height: '40px' }}
        >
        {hasStone && <div className={stoneStyle} style={{ width: '30px', height: '30px' }}></div>}
        </div>
    );
};


export default Cell;

