'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { BoardState, Player, num, ChatMessage, allPlayer } from '../../utils/gameLogic';
import WinnerAnnouncement from '../../components/WinnerAnnouncement';
import Board from '../../components/Board';
import Waiting from '@/app/components/Waiting';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/app/components/Avatar';
import TurnTransition from '../../components/TurnTransition';
import Scoreboard from '@/app/components/ScoreBoard';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import { useToast } from '@/hooks/use-toast';

const ChatPage = ({ params }: { params: { roomId: string } }) => {
  const [board, setBoard] = useState<BoardState>(Array(8).fill(Array(8).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [stones, setStones] = useState<{ black: number, white: number }>({ black: 2, white: 2 });
  const [socId, setSocId] = useState<string | undefined>(undefined);
  const [waiting, setWaiting] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<Boolean>(false);
  const [players, setPlayers] = useState<allPlayer[] | null>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});

  const { toast } = useToast();

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
    if (playerId === socId) {
      socket.emit('sendBubbleMessage', { roomId, playerId, message });
      setChatMessages((prev) => ({ ...prev, [playerId]: message }));
      setTimeout(() => {
        setChatMessages((prev) => ({ ...prev, [playerId]: null }));
      }, 5000);
    }
  };

  useEffect(() => {
    const currentSocketId = socket.id;
    setSocId(currentSocketId);

    socket.emit('joinRoom', roomId, "othello");

    socket.on('playerPassed', ({ player }) => {
      toast({
        title: `${player} がパスしました`,
        description: '',
        duration: 3000,
      });
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

    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('joinOthelloResponse', ({ success, board, currentPlayer }) => {
      if (success) {
        setBoard(board);
        setCurrentPlayer(currentPlayer);
      } else {
        console.log('Failed to join room');
      }
    });

    socket.on('updateGameState', ({ board, currentPlayer, winner, stones, playerCount, isStarted }) => {
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
      toast({
        title: "他の人のターンです",
        description: "Please wait for your turn to play.",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    socket.on('invalidMove', (message) => {
      toast({
        title: "そこに石は置けないよ！",
        description: message.message,
        duration: 4000,
      });
    });

    return () => {
      socket.off('invalidMove');
    };
  }, [toast]);

  const handleWinnerDismiss = () => {
    setWinner(null);
  };

  return (
    <div style={{ backgroundColor: '#696969' }}>
      <div className="container mx-auto relative p-64">
        <AnimatedBackground />
        <TurnTransition currentPlayer={currentPlayer} socId={socId} />
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
                  ownId={socId || ''}
                  onChat={handleChat}
                  chatMessage={chatMessages[player.id || ''] || null}
                  isCurrentPlayer={currentPlayer === player.id}
                />
                {isTeammate && socket.id !== player.id && <span className="mt-2 text-sm text-blue-600">味方</span>}
                {!isTeammate && socket.id !== player.id && <span className="mt-2 text-sm text-red-600">敵</span>}
                貢献度:{player.percent}%
                {currentPlayer === player.id && <strong>ターン中</strong>}
              </div>
            </div>
          );
        })}

        <Board board={board} onCellClick={handleCellClick} />
        <Scoreboard blackStones={stones.black} whiteStones={stones.white} />

        <p className="text-center text-lg font-bold mt-4">
          現在のプレイヤー: {socId === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
        </p>
        <p className="text-center text-lg font-bold mt-4">黒: {stones.black}  白: {stones.white}</p>

        {waiting && !isStarted && <Waiting playerCount={waiting} onDismiss={() => { waiting === num ? setWaiting(0) : null }} />}
        {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
      </div>
    </div>
  );
};

export default ChatPage;

