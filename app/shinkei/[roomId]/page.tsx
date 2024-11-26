'use client';
import React, { useEffect, useState, useMemo } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';
import Waiting from '@/app/components/Waiting';
import { num, Player } from '../../utils/gameLogic';
import { useRouter } from 'next/navigation';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';
import { Avatar } from '@/app/components/Avatar';


type CardType = {
  num: number;
  img: string;
  id: number;
  isMatched: boolean;
};


const page = ({ params }: { params: { roomId: string } }) => {

  const roomId = params.roomId;

  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [card, setCard] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [waiting, setWaiting] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<Boolean>(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [players, setPlayers] = useState<(string | null)[]>([]);
  const [leftTop, setLeftTop] = useState<string | null>(null);
  const [rightTop, setRightTop] = useState<string | null>(null);
  const [leftBottom, setLeftBottom] = useState<string | null>(null);
  const [rightBottom, setRightBottom] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (players.length > 0 && socket.id) {
      const p = Array.from(new Set(players));  
      const myIndex = p.findIndex((id) => id === socket.id);
      const isEven = myIndex % 2 == 0

      if (isEven) {
        if (myIndex === 0) {
          setLeftBottom(p[myIndex] || null);
          setRightBottom(p[2] || null);
        } else if (myIndex === 2) {
          setLeftBottom(p[myIndex] || null);
          setRightBottom(p[0] || null);
        }

        setLeftTop(p[1] || null);
        setRightTop(p[3] || null);
      } else {
        if (myIndex === 1) {
          setLeftBottom(p[myIndex] || null);
          setRightBottom(p[3] || null);
        } else if (myIndex === 3) {
          setLeftBottom(p[myIndex] || null);
          setRightBottom(p[1] || null);
        }

        setLeftTop(p[0] || null);
        setRightTop(p[2] || null);
      }


    }
  }, [players, socket.id]);

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
        // 一致しない場合の処理
        console.log("wrong")
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, card]);

  useEffect(() => {
    socket.emit('joinRoom', roomId, "shinkei");

    socket.on('joinShinkeiResponse', ({ success, cards, currentPlayer }) => {
      if (success) {
        console.log('Received board:', cards);
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('reset', () => {
      alert("相手2人が切断しました")
      router.push('/create/shinkei')
    })

    socket.on('updateShinkeiGameState', ({ cards, currentPlayer, playerCount, winner, flippedCardIndex, isStarted }) => {
      console.log('Game state updated:', cards);
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
      {/* アバターを四隅に配置 */}
      <div className="relative w-full h-full">
        <div className="absolute top-4 left-4">
          <Avatar playerId={leftTop} />
        </div>

        <div className="absolute top-4 right-4">
          <Avatar playerId={rightTop} />
        </div>

        <div className="absolute bottom-4 left-4">
          <Avatar playerId={leftBottom} />
        </div>

        <div className="absolute bottom-4 right-4">
          <Avatar playerId={rightBottom} />
        </div>

        {/* ゲームUI */}
        <div
          className="relative mx-auto grid grid-cols-8 gap-4"
          style={{
            width: '800px',
            marginTop: '150px', // 少し下に調整
          }}
        >
          {card.map((cardo, index) => {
            // ランダムな上下のずれを設定 (-30px から +30px の範囲)
            const offsetY = Math.random() * 60 - 30;

            return (
              <div
                key={index}
                className="relative"
                style={{
                  transform: `translateY(${offsetY}px)`, // 上下にランダムに移動
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

      {/* 現在のプレイヤー情報 */}
      <p className="text-center text-lg font-bold mt-4">
        現在のプレイヤー: {socket.id === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
      </p>

      {/* 待機状態と勝者発表 */}
      {waiting && !isStarted && (
        <Waiting playerCount={waiting} onDismiss={() => (waiting === num ? setWaiting(0) : null)} />
      )}
      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
    </>
  );

}

export default page