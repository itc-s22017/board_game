'use client';
import React, { useEffect, useState, useMemo } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';
import Waiting from '@/app/components/Waiting';
import { num, Player, ChatMessage, allPlayer } from '../../utils/gameLogic';
import { useRouter } from 'next/navigation';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';
import { Avatar } from '@/app/components/Avatar';
import TurnTransition from '@/app/components/TurnTransition';
import { toast, useToast } from '@/hooks/use-toast';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import MatchAnimation from '@/app/components/MatchAnimation';


type CardType = {
  num: number;
  img: string;
  id: number;
  isMatched: boolean;
};

const Page = ({ params }: { params: { roomId: string } }) => {

  const roomId = params.roomId;
  const { toast } = useToast();

  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [card, setCard] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [waiting, setWaiting] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<Boolean>(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [players, setPlayers] = useState<allPlayer[] | null>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);


  useEffect(() => {
    socket.on('receiveBubbleMessage', ({ playerId, message }: ChatMessage) => {
      setChatMessages((prev) => ({ ...prev, [playerId]: message }));

      setTimeout(() => {
        setChatMessages((prev) => ({ ...prev, [playerId]: null }));
      }, 5000);
    });

    return () => {
      socket.off('receiveChat');
    };
  }, []);
  const handleChat = (playerId: string, message: string) => {
    socket.emit('sendBubbleMessage', { roomId, playerId, message });
  };

  const router = useRouter();

  const handleCardClick = (index: number) => {
    if (socket.id === currentPlayer && !card[index].isMatched) {
      if (flippedCards.includes(index) || flippedCards.length === 2) return;
      socket.emit('flipCard', index, roomId);
    }
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      const firstCard = card[flippedCards[0]];
      const secondCard = card[flippedCards[1]];

      if (firstCard.num === secondCard.num) {
        setShowMatchAnimation(true);
        setTimeout(() => {
          setFlippedCards([]);
        }, 300)
      } else {
        setShowMatchAnimation(true);
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, card]);

  useEffect(() => {
    socket.emit('joinRoom', roomId, "shinkei");

    socket.on('joinShinkeiResponse', ({ success }) => {
      if (success) {
        console.log('Success');
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('reset', () => {
      toast({
        title: "相手２人が切断しました",
        description: 'ホーム画面に移動します',
        duration: 5000,
      });
      setTimeout(() => {
        router.push('/')
      }, 2000)
    })

    socket.on('updateShinkeiGameState', ({ cards, currentPlayer, playerCount, winner, flippedCardIndex, isStarted }) => {
      setCard(cards);
      setCurrentPlayer(currentPlayer);
      setWaiting(playerCount);
      setIsStarted(isStarted);
      setWinner(winner);
      setFlippedCards(prev => {
        const newFlippedCards = flippedCardIndex;
        return newFlippedCards
      })
    });

    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off('joinShinkeiResponse');
      socket.off('disconnect');
      socket.off('reset');
      socket.off('updateShinkeiGameState');
      socket.off('updatePlayers');
    };
  }, [roomId, players])

  const handleWinnerDismiss = () => {
    setWinner(null);
  };

  const handleMatchAnimationComplete = () => {
    setShowMatchAnimation(false);
  };

  useEffect(() => {
    if (num === waiting) {
      setWaiting(0)
    }
  }, [waiting])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
      <AnimatedBackground />
      <div className="container relative mx-auto px-4 py-8">
        <TurnTransition className="z-50" currentPlayer={currentPlayer} socId={socket.id} />
        {flippedCards.length >= 2 && flippedCards[0] !== undefined && flippedCards[1] !== undefined &&
          card[flippedCards[0]] && card[flippedCards[1]] &&
          card[flippedCards[0]].num === card[flippedCards[1]].num ? (
          <MatchAnimation
            isVisible={showMatchAnimation}
            onAnimationComplete={handleMatchAnimationComplete}
            text='🎉'
          />
        ) : (
          <MatchAnimation
            isVisible={showMatchAnimation}
            onAnimationComplete={handleMatchAnimationComplete}
            text='✗'
          />
        )}

        <div className="absolute inset-0">
          {players?.map((player, index) => {
            if (player === null) return null;
            const uniqueKey = `${player.id}-${index}`;
            const isTeammate = (index % 2 === 0 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 0) ||
              (index % 2 === 1 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 1);

            let positionClass = '';
            if (index === 0) positionClass = 'top-4 left-4';
            else if (index === 1) positionClass = 'top-4 right-4';
            else if (index === 2) positionClass = 'bottom-4 left-4';
            else if (index === 3) positionClass = 'bottom-4 right-4';

            return (
              <div key={uniqueKey} className={`absolute ${positionClass}`}>
                <div className="flex flex-col items-center mt-20">
                  <Avatar
                    playerId={player.id}
                    ownId={socket.id || ''}
                    onChat={handleChat}
                    chatMessage={chatMessages[player.id || ''] || null}
                    isCurrentPlayer={currentPlayer === player.id}
                  />
                  <div className="mt-1 text-xs font-semibold text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {player.id === socket.id && <span className="text-white text-center">あなた</span>}
                    {isTeammate && socket.id !== player.id && <span className="text-blue-300">味方</span>}
                    {!isTeammate && socket.id !== player.id && <span className="text-red-300">敵</span>}
                    <div>貢献度:{player.percent}%</div>
                    {currentPlayer === player.id && <div>ターン中</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center mt-20">
          <div className="relative mx-auto grid grid-cols-9 gap-8 rounded-lg bg-white/10 p-20 backdrop-blur-md mt-20">
            {card.map((cardo, index) => {
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
                    isFlipped={flippedCards.includes(index) || cardo.isMatched}
                    onClick={() => handleCardClick(index)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center text-lg font-bold text-white">
          現在のプレイヤー: {socket.id === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
        </div>
      </div>

      {waiting && !isStarted && (
        <Waiting playerCount={waiting} onDismiss={() => (waiting === num ? setWaiting(0) : null)} />
      )}
      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
    </div>
  );
}

export default Page