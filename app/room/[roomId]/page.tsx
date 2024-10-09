'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { BoardState, Player } from '../../utils/gameLogic';
import WinnerAnnouncement from '../../components/WinnerAnnouncement';
import Board from '../../components/Board';

const ChatPage = ({ params }: { params: { roomId: string } }) => {
  const [board, setBoard] = useState<BoardState>(Array(8).fill(Array(8).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [stones, setStones] = useState<{ black: number, white: number }>({ black: 2, white: 2 });
  const [socId, setSocId] = useState<string | undefined>(undefined);  // undefined を許容

  const roomId = params.roomId;

  useEffect(() => {
    const currentSocketId = socket.id;
    setSocId(currentSocketId);  // socket.id を取得

    socket.emit('joinothelloRoom', roomId);

    socket.on('playerPassed', ({ player }) => {
      console.log(`Player ${player} has passed their turn.`);
      alert(`Player ${player} has passed!`);
    });

    socket.on('joinRoomResponse', ({ success, board, currentPlayer }) => {
      if (success) {
        console.log('Received board:', board); // 受け取ったボードをログ出力
        setBoard(board);
        setCurrentPlayer(currentPlayer);
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('updateGameState', ({ board, currentPlayer, winner, stones }) => {
      console.log('Game state updated:', board); // 更新されたボードをログ出力
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setWinner(winner);
      setStones(stones);
    });

    return () => {
      socket.off('joinRoomResponse');
      socket.off('updateGameState');
      socket.off('playerPassed');

    };
  }, [roomId]);

  const handleCellClick = (row: number, col: number) => {
    // console.log(currentPlayer === socId)
    if (socId && socId === currentPlayer) {  // socId が undefined でないことを確認
      socket.emit('makeMove', { roomId, row, col });
    } else {
      alert('It is not your turn!');
    }
  };
  
  useEffect(() => {
    socket.on('invalidMove', (message) => {
      alert(message.message);  // 他のプレイヤーが動いた場合の警告
    });
    
    return () => {
      socket.off('invalidMove');
    };
  }, []);
  

  const handleWinnerDismiss = () => {
    setWinner(null);
  };

  return (
    <div className="container mx-auto p-4">
      <Board board={board} onCellClick={handleCellClick} />
      <p className="text-center text-lg font-bold mt-4">
        現在のプレイヤー: {socId === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
      </p>
      <p className="text-center text-lg font-bold mt-4">黒: {stones.black}  白: {stones.white}</p>

      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
    </div>
  );
};

export default ChatPage;
