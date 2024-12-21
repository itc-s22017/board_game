import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BGMPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume?: number;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

// グローバルなAudioインスタンスを管理
const globalAudio: {
  instance: HTMLAudioElement | null;
  isPlaying: boolean;
} = {
  instance: null,
  isPlaying: false
};

const BGMPlayer: React.FC<BGMPlayerProps> = ({
  src,
  autoPlay = false,
  volume = 0.3,
  className = '',
  onPlayStateChange
}) => {
  const [isPlaying, setIsPlaying] = useState(globalAudio.isPlaying);

  const initAudio = useCallback(() => {
    if (!globalAudio.instance) {
      globalAudio.instance = new Audio(src);
      globalAudio.instance.loop = true;
      globalAudio.instance.volume = volume;
    }
    return globalAudio.instance;
  }, [src, volume]);

  const toggleBGM = useCallback(() => {
    const audio = globalAudio.instance || initAudio();

    if (globalAudio.isPlaying) {
      audio.pause();
      globalAudio.isPlaying = false;
    } else {
      audio.play().catch(error => {
        console.error('BGM再生に失敗しました:', error);
        globalAudio.isPlaying = false;
      });
      globalAudio.isPlaying = true;
    }
    
    setIsPlaying(globalAudio.isPlaying);
    onPlayStateChange?.(globalAudio.isPlaying);
  }, [initAudio, onPlayStateChange]);

  useEffect(() => {
    const audio = initAudio();

    if (autoPlay && !globalAudio.isPlaying) {
      audio.play().catch(error => {
        console.error('自動再生に失敗しました:', error);
      });
      globalAudio.isPlaying = true;
      setIsPlaying(true);
      onPlayStateChange?.(true);
    }

    return () => {
      // コンポーネントがアンマウントされても音楽は停止しない
      // 必要な場合のみ以下のコメントを解除
      /*
      if (globalAudio.instance && !document.querySelector('[data-bgm-player]')) {
        globalAudio.instance.pause();
        globalAudio.instance = null;
        globalAudio.isPlaying = false;
      }
      */
    };
  }, [initAudio, autoPlay, onPlayStateChange]);

  useEffect(() => {
    if (globalAudio.instance) {
      globalAudio.instance.volume = volume;
    }
  }, [volume]);

  return (
    <button
      data-bgm-player
      onClick={toggleBGM}
      className={`px-4 py-2 bg-gradient-to-r from-green-400 via-red-500 to-yellow-500 
        shadow-lg rounded-full hover:shadow-xl transition-all duration-300 
        text-white font-medium flex items-center justify-center ${className}`}
    >
      {isPlaying ? (
        <>
          🎄 BGM OFF
        </>
      ) : (
        <>
          🎅 BGM ON
        </>
      )}
    </button>
  );
};

export default React.memo(BGMPlayer);