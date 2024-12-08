import React from 'react';
import { motion } from 'framer-motion';

interface ScoreboardProps {
  blackStones: number;
  whiteStones: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ blackStones, whiteStones }) => {
  return (
    <div className="flex justify-center space-x-8 mt-4">
      <motion.div
        className="bg-black text-white px-4 py-2 rounded-lg shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        黒: {blackStones}
      </motion.div>
      <motion.div
        className="bg-white text-black px-4 py-2 rounded-lg shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        白: {whiteStones}
      </motion.div>
    </div>
  );
};

export default Scoreboard;

