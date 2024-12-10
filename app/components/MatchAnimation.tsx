import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchAnimationProps {
  isVisible: boolean;
  onAnimationComplete: () => void;
  text: string;
  playSound: () => void;
}

const MatchAnimation: React.FC<MatchAnimationProps> = ({ isVisible, onAnimationComplete, text, playSound }) => {
  useEffect(() => {
    if (isVisible) {
      const timer2 = setTimeout(() => {
        playSound();
      }, 500);

      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 1500);

      return () => {
        clearTimeout(timer);  
        clearTimeout(timer2);
      };
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: .5 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-white"
            >
              <span className="text-4xl">{text}</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchAnimation;

