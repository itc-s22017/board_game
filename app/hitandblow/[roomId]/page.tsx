'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import { Player, num } from '../../utils/gameLogic';
import WinnerAnnouncement from '../../components/WinnerAnnouncement';
import Waiting from '@/app/components/Waiting';
import { useRouter } from 'next/navigation';
import trumpUra from '../../img/trump_ura.jpg';


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
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [socId, setSocId] = useState<string | undefined>(undefined);
    const [waiting, setWaiting] = useState<number>(0);
    const [isStarted, setIsStarted] = useState<Boolean>(false);
    const [teamGuesses, setTeamGuesses] = useState<Guess[]>([]);
    const [opponentGuesses, setOpponentGuesses] = useState<Guess[]>([]);
    const [guess, setGuess] = useState<string>('');


    const router = useRouter();
    const roomId = params.roomId;

    const playerCards = number ? number.toString().split('') : [];
    const opponentCardImage = trumpUra.src;
    const isYourTurn = socket.id === currentPlayer

    useEffect(() => {
        const currentSocketId = socket.id;
        setSocId(currentSocketId);

        socket.emit('joinRoom', roomId, "hitandblow");

        socket.on('playerPassed', ({ player }) => {
            console.log(`Player ${player} has passed their turn.`);
            alert(`Player ${player} has passed!`);
        });

        socket.on('reset', () => {
            alert("相手2人が切断しました")
            router.push('/create/othello')
        })

        socket.on('joinHitAndBlowResponse', ({ success, currentPlayer }) => {
            if (success) {
                setCurrentPlayer(currentPlayer);
            } else {
                console.log('Failed to join room');
            }
        });

        socket.on('updatePlayerCount', ({ playerCount }) => {
            setWaiting(playerCount)
        })

        socket.on('updateHitAndBlowGameState', ({ number, currentPlayer, winner, playerCount, isStarted, guesses }) => {
            number !== undefined ? setNumber(number) : setNumber(prev => prev);
            currentPlayer !== undefined ? setCurrentPlayer(currentPlayer) : setCurrentPlayer(prev => prev);
            winner !== undefined ? setWinner(winner) : setWinner(prev => prev);
            playerCount !== undefined ? setWaiting(playerCount) : setWaiting(prev => prev);
            isStarted !== undefined ? setIsStarted(isStarted) : setIsStarted(prev => prev);
            guesses !== undefined ? setOpponentGuesses(guesses.teamA) : setOpponentGuesses(prev => prev);
            guesses !== undefined ? setTeamGuesses(guesses.teamB) : setOpponentGuesses(prev => prev);

        });
        return () => {
            socket.off('joinRoomResponse');
            socket.off('updateHitAndBlowGameState');
            socket.off('playerPassed');
            socket.off('updatePlayerCount');
        };
    }, [roomId]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (/^\d{0,3}$/.test(value)) {
            setGuess(value);
        }
    };


    return (
        <div className="container mx-auto p-4">
            <div className="container mx-auto p-4 flex flex-col justify-between min-h-screen">
                <div className="flex flex-col items-center">
                    <CardHand title="敵チームのカード" cards={[opponentCardImage, opponentCardImage, opponentCardImage]} isImage />
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center mt-4">
                        <input
                            type="text"
                            placeholder="3桁の数値を入力"
                            className="p-2 border border-gray-300 rounded-lg text-center text-2xl"
                            disabled={!isYourTurn}
                            value={guess}
                            onChange={handleChange} />
                        <button
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                            disabled={!isYourTurn}
                            onClick={handleGuessSubmit}
                        >
                            予想を送信
                        </button>

                    </div>
                </div>
                <p>
                    Opponent:
                    {opponentGuesses.map((guessData, index) => (
                        <span key={index}>
                            Guess: {guessData.guess}, Hit: {guessData.hit}, Blow: {guessData.blow} |
                        </span>
                    ))}
                </p>
                <p>
                    YourTeam:
                    {teamGuesses.map((guessData, index) => (
                        <span key={index}>
                            Guess: {guessData.guess}, Hit: {guessData.hit}, Blow: {guessData.blow} |
                        </span>
                    ))}
                </p>
                <div className="flex flex-col items-center">
                    <CardHand title="あなたのチームのカード" cards={playerCards} />
                </div>
            </div>
            {waiting && !isStarted && <Waiting playerCount={waiting} onDismiss={() => { waiting === num ? setWaiting(0) : null }} />}
            {winner && <WinnerAnnouncement winner={winner} onDismiss={handleWinnerDismiss} />}
        </div>

    );
};

export default ChatPage;
