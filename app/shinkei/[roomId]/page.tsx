'use client';
import React, { useEffect, useState } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';
import Waiting from '@/app/components/Waiting';
import { num, Player } from '../../utils/gameLogic';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';


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


  const handleCardClick = (index: number) => {
    if (socket.id === currentPlayer && !card[index].isMatched) {
      if (flippedCards.includes(index) || flippedCards.length === 2) return;
      socket.emit('flipCard',index, roomId);
    }

  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      const firstCard = card[flippedCards[0]];
      const secondCard = card[flippedCards[1]];

      if (firstCard.num === secondCard.num) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        setFlippedCards([]);
      } else {
        // 一致しない場合の処理
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards]);

  useEffect(() => {
    socket.emit('joinRoom', roomId, "shinkei");

    socket.on('joinShinkeiResponse', ({ success, cards, currentPlayer }) => {
      if (success) {
        console.log('Received board:', cards);
      } else {
        console.log('Failed to join room');
      }
    });

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

    return () => {
      socket.off('joinShinkeiResponse');
      socket.off('disconnect');
      socket.off('updateShinkeiGameState');
    };
  }, [roomId])

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
      <div className="grid grid-cols-4">
        {card.map((card, index) => (
          <Card
            key={index}
            img={card.img}
            isFlipped={flippedCards.includes(index) || card.isMatched}
            onClick={() => handleCardClick(index)}
          />
        ))}
        <p className="text-center text-lg font-bold mt-4">
          現在のプレイヤー: {socket.id === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
        </p>
      </div>
      {waiting && !isStarted && <Waiting playerCount={waiting} onDismiss={() => waiting === num ? setWaiting(0) : null} />}
      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}

    </>
  );
}

export default page