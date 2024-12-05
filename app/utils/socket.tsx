import { io } from "socket.io-client";

const socket = io("https://board-game-2t88.vercel.app");

export default socket;
