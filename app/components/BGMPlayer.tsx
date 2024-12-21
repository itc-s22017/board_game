import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BGMPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume?: number;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const BGMPlayer: React.FC<BGMPlayerProps> = ({
  src,
  autoPlay = false,
  volume = 0.3,
  className = '',
  onPlayStateChange
}) => {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio要素の初期化を別の関数に分離
  const initAudio = useCallback(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio(src);
      bgmRef.current.loop = true;
      bgmRef.current.volume = volume;
    }
  }, [src, volume]);

  const toggleBGM = useCallback(() => {
    initAudio();

    if (isPlaying) {
      bgmRef.current?.pause();
    } else {
      bgmRef.current?.play().catch(error => {
        console.error('BGM再生に失敗しました:', error);
      });
    }
    setIsPlaying(!isPlaying);
    onPlayStateChange?.(!isPlaying);
  }, [isPlaying, initAudio, onPlayStateChange]);

  // 初期化用のEffect
  useEffect(() => {
    initAudio();
    
    if (autoPlay) {
      bgmRef.current?.play().catch(error => {
        console.error('自動再生に失敗しました:', error);
      });
      setIsPlaying(true);
      onPlayStateChange?.(true);
    }

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, [initAudio, autoPlay, onPlayStateChange]);

  // volumeの変更を監視
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <button
      onClick={toggleBGM}
      className={`px-4 py-2 bg-white/20 backdrop-blur-md rounded-full 
        hover:bg-white/30 transition-colors duration-200 
        text-white font-medium ${className}`}
    >
      {isPlaying ? '🔊 BGM OFF' : '🔈 BGM ON'}
    </button>
  );
};

export default BGMPlayer;