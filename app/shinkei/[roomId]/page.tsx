'use client';
import React, { useEffect, useState, useMemo } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';
import Waiting from '@/app/components/Waiting';
import { num, Player, ChatMessage } from '../../utils/gameLogic';
import { useRouter } from 'next/navigation';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';
import { Avatar } from '@/app/components/Avatar';


type CardType = {
  num: number;
  img: string;
  id: number;
  isMatched: boolean;
};

type allPlayer = {
  id: string;
  contribution: number;
  percent: number;
};


const page = ({ params }: { params: { roomId: string } }) => {

  const roomId = params.roomId;

  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [card, setCard] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [waiting, setWaiting] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<Boolean>(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [players, setPlayers] = useState<allPlayer[] | null>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});

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
        setTimeout(() => {
          setFlippedCards([]);
        }, 300)
      } else {
        console.log("wrong")
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
        console.log('Received board:');
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('reset', () => {
      alert("相手2人が切断しました")
      router.push('/create/shinkei')
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

    console.log(players)

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

  useEffect(() => {
    if (num === waiting) {
      setWaiting(0)
    }
  }, [waiting])

  return (
    <>
      <div className="relative w-full h-full">
        {players?.map((player, index) => {

          if (player === null) return null;

          const uniqueKey = `${player.id}-${index}`;

          const isTeammate =
            (index % 2 === 0 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 0) ||
            (index % 2 === 1 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 1);

          let positionClass = '';
          if (index === 0) {
            positionClass = 'top-4 left-4';
          } else if (index === 1) {
            positionClass = 'top-4 right-4';
          } else if (index === 2) {
            positionClass = 'bottom-4 left-4';
          } else if (index === 3) {
            positionClass = 'bottom-4 right-4';
          }

          return (
            <div
              key={uniqueKey}
              className={`absolute ${positionClass}`}
            >
              <div className="flex flex-col items-center">
                <Avatar
                  playerId={player.id}
                  ownId={socket.id || ''}
                  onChat={handleChat}
                  chatMessage={chatMessages[player.id || ''] || null}
                />
                {isTeammate && socket.id !== player.id && <span className="mt-2 text-sm text-blue-600">味方</span>}
                {!isTeammate && socket.id !== player.id && <span className="mt-2 text-sm text-red-600">敵</span>}
                貢献度:{player.percent}%
                {currentPlayer === player.id && <strong>ターン中</strong>}
              </div>
            </div>
          );
        })}


        <div
          className="relative mx-auto grid grid-cols-8 gap-4"
          style={{
            width: '800px',
            marginTop: '150px',
          }}
        >
          {card.map((cardo, index) => {
            const offsetY = Math.random() * 60 - 30;

            return (
              <div
                key={index}
                className="relative"
                style={{
                  transform: `translateY(${offsetY}px)`,
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

      <p className="text-center text-lg font-bold mt-4">
        現在のプレイヤー: {socket.id === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
      </p>

      {waiting && !isStarted && (
        <Waiting playerCount={waiting} onDismiss={() => (waiting === num ? setWaiting(0) : null)} />
      )}
      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
    </>
  );

}

export default page