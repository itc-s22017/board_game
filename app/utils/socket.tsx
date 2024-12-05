import { io } from "socket.io-client";

const socket = io("https://board-game-server.vercel.app");
// http://localhost:
export default socket;
