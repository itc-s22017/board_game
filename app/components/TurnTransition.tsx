import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnTransitionProps {
  currentPlayer: string;
  socId: string | undefined;
  className?: string;
}

const TurnTransition: React.FC<TurnTransitionProps> = ({ currentPlayer, socId }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPlayer]);

  const isYourTurn = socId === currentPlayer;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className="fixed left-1/3 top-2/3 z-50 -translate-x-1/2 -translate-y-1/2 transform"
        >
          <div className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-2xl font-bold text-white shadow-lg">
            {isYourTurn ? "あなたのターンです！" : `${currentPlayer}のターンです`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TurnTransition;
