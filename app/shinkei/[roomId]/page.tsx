'use client';
import React, { useEffect } from 'react'
import socket from '@/app/utils/socket';

const page = ({ params }: { params: { roomId: string } }) => {
    const roomId = params.roomId;

    useEffect(() => {
        socket.emit('joinRoom', roomId, "shinkei");

        socket.on('joinShinkeiResponse', ({ success, cards, currentPlayer }) => {
            if (success) {
              console.log('Received board:', cards); 
            //   setBoard(board);
            //   setCurrentPlayer(currentPlayer);
            } else {
              console.log('Failed to join room');
            }
          });

          socket.on('updateShinkeiGameState', ({ cards, currentPlayer,playerCount }) => {
            console.log('Game state updated:', cards); 
            // setBoard(board);
            // setCurrentPlayer(currentPlayer);
            // setWinner(winner);
            // setStones(stones);
            // setWaiting(playerCount)
            // setIsStarted(isStarted)
          });
      
    }, [roomId])
    return (
        <div>page</div>
    )
}

export default page