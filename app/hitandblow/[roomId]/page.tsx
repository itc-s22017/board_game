'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { num, ChatMessage, allPlayer } from '../../utils/gameLogic';
import WinnerAnnouncement2 from '@/app/components/WinnerAnnouncement';
import Waiting from '@/app/components/Waiting';
import { useRouter } from 'next/navigation';
import trumpUra from '../../img/trump_ura.jpg';
import { Avatar } from '@/app/components/Avatar';
import TurnTransition from '@/app/components/TurnTransition';
import { useToast } from '@/hooks/use-toast';
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
        <div className="p-14 bg-gray-100">
            <h2 className="text-lg font-bold mb-4 text-center">予想結果</h2>
            <div className="flex justify-around w-full">
                <div className="w-full">
                    <h3 className="text-center text-blue-600 font-semibold mb-4">味方チーム</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ownTeam.slice(0).reverse().map((data, index) => (
                            <div
                                key={`own-${index}`}
                                className="flex justify-between items-center bg-white p-2 rounded shadow"
                            >
                                <span className="font-semibold">{ownTeam.length - index}回目</span>
                                <span className="font-semibold">予想:</span> {data.guess}
                                <span className="font-semibold">ヒット:</span> {data.hit}
                                <span className="font-semibold">ブロー:</span> {data.blow}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full">
                    <h3 className="text-center text-red-600 font-semibold mb-4">敵チーム</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {/* 予想結果を逆順で表示 */}
                        {opponentTeam.slice(0).reverse().map((data, index) => (
                            <div
                                key={`opponent-${index}`}
                                className="flex justify-between items-center bg-white p-2 rounded shadow"
                            >
                                <span className="font-semibold">{opponentTeam.length - index}回目</span>
                                <span className="font-semibold">予想:</span> {data.guess}
                                <span className="font-semibold">ヒット:</span> {data.hit}
                                <span className="font-semibold">ブロー:</span> {data.blow}
                            </div>
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
            <div className="text-center mb-2 text-lg font-semibold">{title}</div>
            <div className="flex justify-center space-x-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-300 rounded-lg shadow-lg w-24 h-36 flex items-center justify-center text-2xl font-bold"
                    >
                        {isImage ? (
                            <img src={card as string} alt="Opponent's Card" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            card
                        )}
                    </div>
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
        <div className="container mx-auto p-4">
            <div className="relative w-full h-full flex flex-col justify-between">
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
                                    ownId={socket.id || ''}
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

                {/* カード */}
                <div className="flex flex-col items-center mt-4">
                    <CardHand title="敵チームのカード" cards={[opponentCardImage, opponentCardImage, opponentCardImage]} isImage />
                </div>
                <div className="flex flex-col items-center mt-4">
                    <p className="text-center text-lg font-bold mt-4">
                        現在のプレイヤー: {socId === currentPlayer ? 'あなた' : currentPlayer?.toUpperCase()}
                    </p>
                    <input
                        type="text"
                        placeholder="3桁の数値を入力"
                        className="p-2 border border-gray-300 rounded-lg text-center text-2xl"
                        disabled={!isYourTurn}
                        value={guess}
                        onChange={handleChange}
                    />
                    <button
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                        disabled={!isYourTurn}
                        onClick={handleGuessSubmit}
                    >
                        予想を送信
                    </button>
                </div>

                {/* 予想結果テーブル */}
                <GuessTable ownTeam={teamGuesses} opponentTeam={opponentGuesses} />

                {/* 自分のチームのカード */}
                <div className="flex flex-col items-center">
                    <CardHand title="あなたのチームのカード" cards={playerCards} />
                </div>
            </div>

            {/* 待機画面 */}
            {waiting && !isStarted && <Waiting playerCount={waiting} onDismiss={() => { waiting === num ? setWaiting(0) : null }} />}
            {winner && <WinnerAnnouncement2 winner={winner !== yourTeam ? '敵チーム' : 'あなたのチーム'} onDismiss={handleWinnerDismiss} />}
        </div>

    );
};
export default ChatPage;