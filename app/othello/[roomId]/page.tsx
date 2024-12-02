'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { BoardState, Player, num, ChatMessage } from '../../utils/gameLogic';
import WinnerAnnouncement from '../../components/WinnerAnnouncement';
import Board from '../../components/Board';
import Waiting from '@/app/components/Waiting';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/app/components/Avatar';

const ChatPage = ({ params }: { params: { roomId: string } }) => {
  const [board, setBoard] = useState<BoardState>(Array(8).fill(Array(8).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [stones, setStones] = useState<{ black: number, white: number }>({ black: 2, white: 2 });
  const [socId, setSocId] = useState<string | undefined>(undefined);
  const [waiting, setWaiting] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<Boolean>(false);
  const [players, setPlayers] = useState<(string | null)[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});

  const router = useRouter();

  const roomId = params.roomId;

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

  useEffect(() => {
    const currentSocketId = socket.id;
    setSocId(currentSocketId);

    socket.emit('joinRoom', roomId, "othello");

    socket.on('playerPassed', ({ player }) => {
      console.log(`Player ${player} has passed their turn.`);
      alert(`Player ${player} has passed!`);
    });

    socket.on('reset', () => {
      alert("相手2人が切断しました")
      router.push('/create/othello')
    })

    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      console.log(updatedPlayers)
    });

    socket.on('joinOthelloResponse', ({ success, board, currentPlayer }) => {
      if (success) {
        console.log('Received board:', board);
        setBoard(board);
        setCurrentPlayer(currentPlayer);
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('updateGameState', ({ board, currentPlayer, winner, stones, playerCount, isStarted }) => {
      console.log('Game state updated:', board);
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setWinner(winner);
      setStones(stones);
      setWaiting(playerCount)
      setIsStarted(isStarted)
    });

    return () => {
      socket.off('joinRoomResponse');
      socket.off('updateGameState');
      socket.off('updatePlayers');
      socket.off('playerPassed');
    };
  }, [roomId, players]);

  useEffect(() => {
    if (num === waiting) {
      setWaiting(0)
    }
  }, [waiting])

  const handleCellClick = (row: number, col: number) => {
    if (socId && socId === currentPlayer) {
      socket.emit('makeMove', { roomId, row, col });
    } else {
      alert('It is not your turn!');
    }
  };

  useEffect(() => {
    socket.on('invalidMove', (message) => {
      alert(message.message);
    });

    return () => {
      socket.off('invalidMove');
    };
  }, []);


  const handleWinnerDismiss = () => {
    setWinner(null);
  };

  return (
    <div className="container mx-auto relative p-64">
      {players.map((playerId, index) => {
        const isTeammate = (index % 2 === 0 && players.indexOf(socket.id || null) % 2 === 0) || (index % 2 === 1 && players.indexOf(socket.id || null) % 2 === 1);

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
            key={index}
            className={`absolute ${positionClass}`}
          >
            <div className="flex flex-col items-center">
              <Avatar
                playerId={playerId}
                ownId={socket.id || ''}
                onChat={handleChat}
                chatMessage={chatMessages[playerId || ''] || null}
              />
              {isTeammate && socket.id !== playerId && <span className="mt-2 text-sm text-blue-600">味方</span>}
              {!isTeammate && socket.id !== playerId && <span className="mt-2 text-sm text-red-600">敵</span>}
              {currentPlayer === playerId && <strong>ターン中</strong>}
            </div>
          </div>
        );
      })}

      <Board board={board} onCellClick={handleCellClick} />

      <p className="text-center text-lg font-bold mt-4">
        現在のプレイヤー: {socId === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
      </p>
      <p className="text-center text-lg font-bold mt-4">黒: {stones.black}  白: {stones.white}</p>

      {waiting && !isStarted && <Waiting playerCount={waiting} onDismiss={() => { waiting === num ? setWaiting(0) : null }} />}
      {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
    </div>
  );
};

export default ChatPage;
