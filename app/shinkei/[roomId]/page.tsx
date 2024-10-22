'use client';
import React, { useEffect, useState } from 'react'
import socket from '@/app/utils/socket';
import Card from '@/app/components/Card';

type CardType = {
  num: number;
  img: string;
  id: number;
};


const page = ({ params }: { params: { roomId: string }}) => {

  const roomId = params.roomId;

  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [card, setCard] = useState<CardType[]>([]);

  const handleCardClick = (index: number) => {
    setFlippedCards((prev) => [...prev, index]);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setTimeout(() => {
        setFlippedCards([]);
      }, 1000);
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

    socket.on('updateShinkeiGameState', ({ cards, currentPlayer, playerCount }) => {
      console.log('Game state updated:', cards);
      setCard(cards)

    });

  }, [roomId])
  return (
    <div className="grid grid-cols-4">
      {card.map((card, index) => (
        <Card
          key={index}
          img={card.img}
          isFlipped={flippedCards.includes(index)}
          onClick={() => handleCardClick(index)}
        />
      ))}
    </div>
  );
}

export default page