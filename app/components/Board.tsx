import React from 'react';
import { motion } from 'framer-motion';

interface BoardProps {
  board: (string | null)[][];
  onCellClick: (row: number, col: number) => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick }) => {
    return (
      <div className="grid grid-cols-8 gap-[1px] bg-green-800 p-2 rounded-lg shadow-lg w-fit mx-auto">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className="w-10 h-10 bg-green-600 rounded-sm flex items-center justify-center cursor-pointer"
              onClick={() => onCellClick(rowIndex, colIndex)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {cell && (
                <motion.div
                  className={`w-9 h-9 rounded-full ${
                    cell === 'black' ? 'bg-black' : 'bg-white'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          ))
        )}
      </div>
    );
  };
  

export default Board;

