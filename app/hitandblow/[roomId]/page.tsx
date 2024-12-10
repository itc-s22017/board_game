'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { num, ChatMessage, allPlayer } from '../../utils/gameLogic';
import WinnerAnnouncement from '@/app/components/WinnerAnnouncement';
import Waiting from '@/app/components/Waiting';
import { useRouter } from 'next/navigation';
import trumpUra from '../../img/trump_ura.jpg';
import { Avatar } from '@/app/components/Avatar';
import TurnTransition from '@/app/components/TurnTransition';
import { useToast } from '@/hooks/use-toast';
import ChristmasBackground from '@/app/components/ChristmasBackground';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/app/components/AnimatedBackground';

type CardHandProps = {
    title: string;
    cards: (string | number)[];
    isImage?: boolean;
};

type Guess = {
    guess: string;
    hit: number;
    blow: number;
};

type Props = {
    ownTeam: Guess[];
    opponentTeam: Guess[];
};

const GuessTable: React.FC<Props> = ({ ownTeam, opponentTeam }) => {
    return (
        <div className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-xl z-1 w-full max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center text-red-100">予想結果</h2>
            <div className="flex justify-between space-x-4">
                <div className="w-1/2 px-2">
                    <h3 className="text-center text-blue-300 font-semibold mb-4">味方チーム</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ownTeam.slice(0).reverse().map((data, index) => (
                            <motion.div
                                key={`own-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex justify-between items-center bg-blue-500/20 p-2 rounded shadow text-white"
                            >
                                <span className="font-semibold">{ownTeam.length - index}回目</span>
                                <span>予想: {data.guess}</span>
                                <span>ヒット: {data.hit}</span>
                                <span>ブロー: {data.blow}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="w-1/2 px-2">
                    <h3 className="text-center text-red-300 font-semibold mb-4">敵チーム</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {opponentTeam.slice(0).reverse().map((data, index) => (
                            <motion.div
                                key={`opponent-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex justify-between items-center bg-red-500/20 p-2 rounded shadow text-white"
                            >
                                <span className="font-semibold">{opponentTeam.length - index}回目</span>
                                <span>予想: {data.guess}</span>
                                <span>ヒット: {data.hit}</span>
                                <span>ブロー: {data.blow}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CardHand: React.FC<CardHandProps> = ({ title, cards, isImage = false }) => {
    return (
        <div className="flex flex-col items-center space-y-2 mb-4">
            <div className="text-center mb-2 text-xl font-semibold text-red-100">{title}</div>
            <div className="flex justify-center space-x-4">
                {cards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white border-4 border-red-700 rounded-lg shadow-lg w-24 h-36 flex items-center justify-center text-3xl font-bold transform hover:scale-105 transition-transform duration-200"
                        style={{ perspective: '1000px' }}
                    >
                        {isImage ? (
                            <img src={card as string} alt="Opponent's Card" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <span className="text-red-700">{card}</span>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


const ChatPage = ({ params }: { params: { roomId: string } }) => {
    const [number, setNumber] = useState<number>(0);
    const [currentPlayer, setCurrentPlayer] = useState<string>('');
    const [winner, setWinner] = useState<string | null>(null);
    const [socId, setSocId] = useState<string | undefined>(undefined);
    const [waiting, setWaiting] = useState<number>(0);
    const [isStarted, setIsStarted] = useState<Boolean>(false);
    const [teamGuesses, setTeamGuesses] = useState<Guess[]>([]);
    const [opponentGuesses, setOpponentGuesses] = useState<Guess[]>([]);
    const [guess, setGuess] = useState<string>('');
    const [yourTeam, setYourTeam] = useState<string>('');
    const [players, setPlayers] = useState<allPlayer[] | null>([]);
    const [chatMessages, setChatMessages] = useState<Record<string, string | null>>({});


    const router = useRouter();
    const { toast } = useToast();
    const roomId = params.roomId;

    const playerCards = number && number !== 0 ? number.toString().split('') : [];
    const opponentCardImage = trumpUra.src;
    const isYourTurn = socket.id === currentPlayer

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

        socket.emit('joinRoom', roomId, "hitandblow");

        socket.on('joinHitAndBlowResponse', ({ success, currentPlayer }) => {
            if (success) {
                setCurrentPlayer(currentPlayer);
            } else {
                console.log('Failed to join room');
            }
        });

        socket.on('updatePlayerCount', ({ playerCount }) => {
            setWaiting(playerCount);
        });

        socket.on('updateHitAndBlowGameState', ({ number, currentPlayer, winner, playerCount, isStarted, guesses, team }) => {

            if (team) {
                setYourTeam(team);
            }
            if (number !== undefined) setNumber(number);
            if (currentPlayer !== undefined) setCurrentPlayer(currentPlayer);
            if (winner !== undefined) setWinner(winner);
            if (playerCount !== undefined) setWaiting(playerCount);
            if (isStarted !== undefined) setIsStarted(isStarted);

            if (guesses) {
                if (yourTeam === 'blue') {
                    setTeamGuesses(guesses.teamA);
                    setOpponentGuesses(guesses.teamB);
                } else if (yourTeam === 'red') {
                    setTeamGuesses(guesses.teamB);
                    setOpponentGuesses(guesses.teamA);
                } else {
                    console.log("Team not set correctly");
                }
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

        socket.on('updatePlayers', (updatedPlayers) => {
            setPlayers(updatedPlayers);
            console.log(updatedPlayers)
        });

        console.log(players)
        return () => {
            socket.off('joinHitAndBlowResponse');
            socket.off('updateHitAndBlowGameState');
            socket.off('playerPassed');
            socket.off('updatePlayerCount');
            socket.off('invalidMove');
        };
    }, [roomId, yourTeam, waiting, players]);

    useEffect(() => {
        if (num === waiting) {
            setWaiting(0)
        }
    }, [waiting])

    const handleGuessSubmit = () => {
        if (guess.length === 3) {
            socket.emit('makeGuess', roomId, guess);
            setGuess('')
        }
    };

    const handleWinnerDismiss = () => {
        setWinner(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (/^\d{0,3}$/.test(value)) {
            setGuess(value);
        }
    };




    return (
        <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-red-900 to-green-900">
            {/* <ChristmasBackground /> */}
            <AnimatedBackground />
            <div className="container mx-auto p-4 relative z-10">
                <div className="flex flex-col justify-between min-h-screen">
                    <TurnTransition currentPlayer={currentPlayer} socId={socId} />
                    {players?.map((player, index) => {

                        if (player === null) return null;

                        const uniqueKey = `${player.id}-${index}`;

                        const isTeammate =
                            (index % 2 === 0 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 0) ||
                            (index % 2 === 1 && players.findIndex(p => p?.id === (socket.id || null)) % 2 === 1);

                        let positionClass = '';
                        if (index === 0) {
                            positionClass = 'top-24 left-4';
                        } else if (index === 1) {
                            positionClass = 'top-24 right-4';
                        } else if (index === 2) {
                            positionClass = 'absolute left-4' + ' bottom-[150px]';
                        } else if (index === 3) {
                            positionClass = 'absolute right-4' + ' bottom-[150px]';
                        }

                        return (
                            <div
                                key={uniqueKey}
                                className={`absolute ${positionClass}`}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm z-10">
                                            {index + 1}
                                        </div>
                                        <Avatar
                                            playerId={player.id}
                                            ownId={socket.id || ''}
                                            onChat={handleChat}
                                            chatMessage={chatMessages[player.id || ''] || null}
                                            isCurrentPlayer={currentPlayer === player.id}
                                        />
                                    </div>
                                    <div className="mt-1 text-xs font-semibold text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {player.id === socId && <span className="text-white text-center">あなた</span>}
                                        {isTeammate && socId !== player.id && <span className="text-blue-300">味方</span>}
                                        {!isTeammate && socId !== player.id && <span className="text-red-300">敵</span>}
                                        <div>貢献度:{player.percent}%</div>
                                        {currentPlayer === player.id && <div>ターン中</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex flex-col items-center mt-4 space-y-8">
                        <CardHand title="敵チームのカード" cards={[opponentCardImage, opponentCardImage, opponentCardImage]} isImage />

                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-100 mb-4">
                                現在のプレイヤー: {socId === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
                            </p>
                            <input
                                type="text"
                                placeholder="3桁の数値を入力"
                                className="p-3 border-2 border-red-700 rounded-lg text-center text-2xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={!isYourTurn}
                                value={guess}
                                onChange={handleChange}
                            />
                            <motion.button
                                className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-xl shadow-lg hover:bg-green-700 transition-colors duration-200"
                                disabled={!isYourTurn}
                                onClick={handleGuessSubmit}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                予想を送信
                            </motion.button>
                        </div>

                        <GuessTable ownTeam={teamGuesses} opponentTeam={opponentGuesses} />

                        <CardHand title="あなたのチームのカード" cards={playerCards} />
                    </div>
                </div>
            </div>

            {waiting && !isStarted && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <Waiting playerCount={waiting} onDismiss={() => { waiting === num ? setWaiting(0) : null }} />
                </div>
            )}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <WinnerAnnouncement winner={winner !== yourTeam ? '敵チーム' : 'あなたのチーム'} onDismiss={handleWinnerDismiss} />
                </div>
            )}
        </div>
    );
};

export default ChatPage;