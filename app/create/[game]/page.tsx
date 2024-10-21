"use client";

import { useState, useEffect } from "react";
import ReactModal from "react-modal";
import Button from "../../components/Button";
import socket from "../../utils/socket";
import { useRouter, useSearchParams } from "next/navigation";
import { createRandomNumber } from "../../utils/createRandomNumber";

// ReactModal.setAppElement("#root");

interface ModalStyles {
  overlay?: React.CSSProperties;
  content?: React.CSSProperties;
}

const modalStyle: ModalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  content: {
    position: "absolute",
    top: "20rem",
    left: "30rem",
    right: "30rem",
    bottom: "20rem",
    backgroundColor: "#ddd",
    borderRadius: "1rem",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }
};



const CreateRoomModal = ({ isOpen, onClose, game }: { isOpen: boolean; onClose: () => void; game: string }) => {
  const router = useRouter();

  const roomId = createRandomNumber()

  const handleCreateRoom = () => {
    if (roomId.trim() !== "") {
      socket.emit(`create${game}Room`, roomId, socket.id);
      router.push(`/${game}/${roomId}`);
      onClose();
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyle}
      ariaHideApp={false}
    >
      <div className="flex flex-col justify-center items-center space-y-4">
        <Button text="Create Room" onClick={handleCreateRoom} />
        <Button text="Close" onClick={onClose} />
      </div>
    </ReactModal>
  );
};

const JoinRoomModal = ({ isOpen, onClose, game }: { isOpen: boolean; onClose: () => void; game: string }) => {
  const [roomId, setRoomId] = useState<string>("");
  const router = useRouter();
  const [joinRoomStatus, setJoinRoomStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleJoinRoomResponse = (response: { success: boolean, isMax: boolean }) => {
      console.log('Received joinRoomResponse:', response);
      if (response.success) {
        router.push(`/${game}/${roomId}`);
        onClose();
      } else {
        if (response.isMax) {
          alert('人数がいっぱいです');
        } else {
          alert("ルームが存在しません");
        }
        setJoinRoomStatus("failed");
      }
    };

    socket.on("RoomResponse", handleJoinRoomResponse);

    return () => {
      socket.off("RoomResponse", handleJoinRoomResponse);
    };
  }, [roomId, router, onClose]);


  const handleJoinRoom = () => {
    if (roomId.trim() !== "") {
      console.log(`Emitting join${game}Room event with roomId: ${roomId}`);
      socket.emit(`checkRoom`, roomId,game);
      console.log(socket.id)
    }
  };


  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyle}
      ariaHideApp={false}
    >
      <div className="flex flex-col justify-center items-center space-y-4">
        <input
          type="text"
          className="p-2 border border-gray-300 rounded-md"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Button text="Join Room" onClick={handleJoinRoom} />
        <Button text="Close" onClick={onClose} />
      </div>
    </ReactModal>
  );
};

export default function Home({ params }: { params: { game: string } }) {
  const [isCreateRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [rooms, setRooms] = useState<string[]>([]);

  const game = params.game


  useEffect(() => {
    const handleHasRoom = (roomList: string[]) => {
      setRooms(roomList);
    };

    socket.on('connect', () => {
      console.log('Connected with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected with ID:', socket.id);
    });

    socket.emit('existroom',game);
    socket.on('hasroom', handleHasRoom);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('hasroom', handleHasRoom);
    };
  }, []);

  return (
    <div id="root" className="flex flex-col justify-center items-center h-screen space-y-4">
      <Button text="Create Room" onClick={() => setCreateRoomModalOpen(true)} />
      <Button text="Join Room" onClick={() => setJoinRoomModalOpen(true)} />
      <CreateRoomModal isOpen={isCreateRoomModalOpen} onClose={() => setCreateRoomModalOpen(false)} game={game} />
      <JoinRoomModal isOpen={isJoinRoomModalOpen} onClose={() => setJoinRoomModalOpen(false)} game={game} />

      <div className="mt-4">
        <h2 className="text-lg font-bold">Available Rooms</h2>
        <ul>
          {rooms.map((room, index) => (
            <li key={index} className="p-2 border border-gray-300 rounded-md">
              Room ID: {room}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}