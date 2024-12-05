import { io } from "socket.io-client";

const socket = io("https://board-game-server.vercel.app", {
    transports: ['polling']  
  });
export default socket;
