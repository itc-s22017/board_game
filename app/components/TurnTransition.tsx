import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnTransitionProps {
  currentPlayer: string;
  socId: string | undefined;
}

const TurnTransition: React.FC<TurnTransitionProps> = ({ currentPlayer, socId }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 1000);
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
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          <div
            className={`${currentPlayer === socId ? "bg-blue-500" : "bg-primary"
              } text-primary-foreground px-6 py-3 rounded-lg shadow-lg text-2xl font-bold`}
          >
            {isYourTurn ? "あなたのターンです！" : `${currentPlayer}のターンです`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TurnTransition;

