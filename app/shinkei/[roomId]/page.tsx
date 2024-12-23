'use client';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';
import Waiting from '@/app/components/Waiting';
import { num, ChatMessage, allPlayer } from '../../utils/gameLogic';
import { useRouter } from 'next/navigation';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';
import { Avatar } from '@/app/components/Avatar';
import TurnTransition from '@/app/components/TurnTransition';
import { toast } from '@/hooks/use-toast';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import MatchAnimation from '@/app/components/MatchAnimation';
import BGMPlayer from '@/app/components/BGMPlayer';

const NOTIFICATION_SOUND = '/audio/notification.mp3';
const FLIP_CARD_SOUND = '/audio/flipCard.mp3';
const INCORRECT_SOUND = '/audio/bubu.mp3';
const CORRECT_SOUND = '/audio/pinpon.mp3';
const JOIN_SOUND = '/audio/join.mp3';
const CHRISTMAS_BGM = '/audio/christmas.mp3';

type CardType = {
  num: number;
  img: string;
  id: number;
  isMatched: boolean;
};

type Player2 = 'red' | 'blue';

const Page = ({ params }: { params: { roomId: string } }) => {
  const roomId = params.roomId;
  const router = useRouter();
  const lastClickTime = useRef(0);

  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const [state, setState] = useState({
    flippedCards: [] as number[],
    card: [] as CardType[],
    currentPlayer: '',
    waiting: 0,
    isStarted: false,
    winner: null as Player2 | 'draw' | null,
    players: null as allPlayer[] | null,
    showMatchAnimation: false,
  });

  const playSound = useCallback(async (mp3: string) => {
    if (!audioCache.current[mp3]) {
      audioCache.current[mp3] = new Audio(mp3);
    }
    await audioCache.current[mp3].play().catch(error => {
      console.error('オーディオ再生に失敗しました:', error);
    });
  }, []);


  const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});

  const handleChat = useCallback((playerId: string, message: string) => {
    socket.emit('sendBubbleMessage', { roomId, playerId, message });
  }, [roomId]);

  const handleCardClick = useCallback((index: number) => {
    const now = Date.now();
    if (now - lastClickTime.current < 500) {
      return;
    }
    lastClickTime.current = now;

    const flippedCards = [...state.flippedCards];

    if (socket.id !== state.currentPlayer || state.card[index].isMatched) return;

    if (flippedCards.includes(index) || flippedCards.length === 2) return;

    flippedCards.push(index);

    socket.emit('flipCard', index, roomId);
  }, [state.currentPlayer, state.card, state.flippedCards, roomId]);



  useEffect(() => {
    const handleBubbleMessage = ({ playerId, message }: ChatMessage) => {
      setChatMessages((prev) => ({ ...prev, [playerId]: message }));
      playSound(NOTIFICATION_SOUND);

      const timeoutId = setTimeout(() => {
        setChatMessages((prev) => ({ ...prev, [playerId]: null }));
      }, 5000);

      return () => clearTimeout(timeoutId);
    };

    const handleJoinRoom = ({ success }: { success: boolean }) => {
      if (success) {
        console.log('Successfully joined room');
      } else {
        console.log('Failed to join room');
      }
    };

    const handleReset = () => {
      toast({
        title: "相手２人が切断しました",
        description: 'ホーム画面に移動します',
        duration: 5000,
      });
      setTimeout(() => router.push('/'), 2000);
    };

    const handleGameStateUpdate = ({
      cards,
      currentPlayer,
      playerCount,
      winner,
      flippedCardIndex,
      isStarted
    }: any) => {
      setState(prev => ({
        ...prev,
        card: cards,
        currentPlayer,
        waiting: playerCount,
        isStarted,
        winner,
        flippedCards: flippedCardIndex
      }
      ));
      if (isStarted) {
        playSound(FLIP_CARD_SOUND);
      }
    };

    const handlePlayerUpdate = (updatedPlayers: allPlayer[]) => {
      setState(prev => ({ ...prev, players: updatedPlayers }));
    };

    const handleDisconnect = (dcPlayer: any) => {
      toast({
        title: `${dcPlayer.dcPlayer}番目のプレイヤーが切断しました`,
        duration: 5000,
      });
    };


    socket.on('receiveBubbleMessage', handleBubbleMessage);
    socket.on('joinShinkeiResponse', handleJoinRoom);
    socket.on('reset', handleReset);
    socket.on('updateShinkeiGameState', handleGameStateUpdate);
    socket.on('updatePlayers', handlePlayerUpdate);
    socket.on('dc', handleDisconnect);

    socket.emit('joinRoom', roomId, "shinkei");

    return () => {
      socket.off('receiveBubbleMessage');
      socket.off('joinShinkeiResponse');
      socket.off('reset');
      socket.off('updateShinkeiGameState');
      socket.off('updatePlayers');
      socket.off('dc');
    };
  }, [roomId, playSound, router]);

  // useEffect(() => {
  //   playSound(JOIN_SOUND);
  // }, [state.players])


  useEffect(() => {
    if (state.flippedCards.length === 2) {
      const firstCard = state.card[state.flippedCards[0]];
      const secondCard = state.card[state.flippedCards[1]];

      setState(prev => ({ ...prev, showMatchAnimation: true }));

      setTimeout(() => {
        setState(prev => ({
          ...prev,
          flippedCards: [],
          showMatchAnimation: false
        }));
      }, 2000);
    }
  }, [state.flippedCards, state.card]);

  useEffect(() => {
    if (num === state.waiting) {
      setState(prev => ({ ...prev, waiting: 0 }))
    }
  }, [state.waiting])


  const getWinnerMessage = useMemo(() => {
    if (state.winner === 'draw') return '引き分けです！';

    const isMyTeam = (playerIndex: number) => {
      if (!state.players) return false;

      const playerIndexInRoom = state.players.findIndex(p => p?.id === socket.id);

      if (playerIndexInRoom === -1) return false;

      return (playerIndex % 2 === 0 && playerIndexInRoom % 2 === 0) ||
        (playerIndex % 2 === 1 && playerIndexInRoom % 2 === 1);
    };

    if (state.winner === 'red') {
      return isMyTeam(0) || isMyTeam(2) ? 'あなたのチーム' : '敵チーム';
    } else if (state.winner === 'blue') {
      return isMyTeam(1) || isMyTeam(3) ? 'あなたのチーム' : '敵チーム';
    }

    return '';
  }, [state.winner, state.players]);

  const PlayerPositions = useMemo(() => {
    const positions = [
      'top-4 left-4',
      'top-4 right-4',
      'bottom-4 left-4',
      'bottom-4 right-4'
    ];
    return positions;
  }, []);

  const renderPlayers = useMemo(() => {
    return state.players?.map((player, index) => {
      if (!player) return null;

      const isTeammate =
        (index % 2 === 0 && (state.players?.findIndex(p => p?.id === socket.id) ?? -1) % 2 === 0) ||
        (index % 2 === 1 && (state.players?.findIndex(p => p?.id === socket.id) ?? -1) % 2 === 1);


      return (
        <div
          key={`${player.id}-${index}`}
          className={`absolute ${PlayerPositions[index]}`}
        >
          <div className="flex flex-col items-center mt-20">
            <div className="relative">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm z-10">
                {index + 1}
              </div>
              <Avatar
                playerId={player.id}
                ownId={socket.id || ''}
                onChat={handleChat}
                chatMessage={chatMessages[player.id || ''] || null}
                isCurrentPlayer={state.currentPlayer === player.id}
              />
            </div>
            <div className="mt-1 text-xs font-semibold text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              {player.id === socket.id && <span className="text-white text-center">あなた</span>}
              {isTeammate && socket.id !== player.id && <span className="text-blue-300">味方</span>}
              {!isTeammate && socket.id !== player.id && <span className="text-red-300">敵</span>}
              <div>貢献度:{player.percent}%</div>
              {state.currentPlayer === player.id && <div>ターン中</div>}
            </div>
          </div>
        </div>
      );
    });
  }, [state.players, state.currentPlayer, handleChat, chatMessages, PlayerPositions]);

  const handleWinnerDismiss = useCallback(() => {
    setState(prev => ({ ...prev, winner: null }));
  }, []);

  const renderCards = useMemo(() => {
    return state.card.map((cardo, index) => {
      const offsetY = Math.random() * 40 - 20;
      const offsetX = Math.random() * 20 - 10;

      return (
        <div
          key={index}
          className="relative transition-transform duration-300 ease-in-out hover:scale-105"
          style={{
            transform: `translateY(${offsetY}px) translateX(${offsetX}px)`,
          }}
        >
          <Card
            img={cardo.img}
            isFlipped={state.flippedCards.includes(index) || cardo.isMatched}
            onClick={() => handleCardClick(index)}
          />
        </div>
      );
    });
  }, [state.card, state.flippedCards, handleCardClick]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
      <AnimatedBackground />
      <BGMPlayer
        src={CHRISTMAS_BGM}
        autoPlay={false}  
        volume={0.3}
        className="fixed top-4 right-4 z-50"
        onPlayStateChange={(isPlaying) => console.log('BGM playing:', isPlaying)}
      />
      <div className="container relative mx-auto px-4 py-8">
        <TurnTransition className="z-50" currentPlayer={state.currentPlayer} socId={socket.id} />

        {state.flippedCards.length >= 2 && state.flippedCards[0] !== undefined && state.flippedCards[1] !== undefined &&
          state.card[state.flippedCards[0]] && state.card[state.flippedCards[1]] &&
          state.card[state.flippedCards[0]].num === state.card[state.flippedCards[1]].num ? (
          <MatchAnimation
            isVisible={state.showMatchAnimation}
            onAnimationComplete={() => setState(prev => ({ ...prev, showMatchAnimation: false }))}
            text='🎉'
            playSound={() => playSound(CORRECT_SOUND)}
          />
        ) : (
          <MatchAnimation
            isVisible={state.showMatchAnimation}
            onAnimationComplete={() => setState(prev => ({ ...prev, showMatchAnimation: false }))}
            text='✗'
            playSound={() => playSound(INCORRECT_SOUND)}
          />
        )}

        <div className="absolute inset-0">
          {renderPlayers}
        </div>

        <div className="flex justify-center items-center mt-20">
          <div className="relative mx-auto grid grid-cols-4 gap-8 rounded-lg bg-white/10 p-20 backdrop-blur-md mt-20">
            {renderCards}
          </div>
        </div>

        <div className="mt-8 text-center text-lg font-bold text-white">
          現在のプレイヤー: {socket.id === state.currentPlayer ? 'あなた' : state.players
            ? (() => {
              const playerIndex = state.players.findIndex(player => player?.id === state.currentPlayer);
              return playerIndex !== -1 ? `プレイヤー${playerIndex + 1}` : '不明';
            })()
            : '不明'}
        </div>
      </div>

      {state.waiting && !state.isStarted && (
        <Waiting
          playerCount={state.waiting}
          onDismiss={() => (state.waiting === num ? setState(prev => ({ ...prev, waiting: 0 })) : null)}
        />
      )}

      {state.winner && (
        <WinnerAnnouncement
          winner={getWinnerMessage}
          onDismiss={handleWinnerDismiss}
        />
      )}
    </div>
  );
}

export default React.memo(Page);