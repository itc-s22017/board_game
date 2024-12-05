"use client";

import { useState, useEffect, useRef } from "react";
import ReactModal from "react-modal";
import socket from "../../utils/socket";
import { createRandomNumber } from "../../utils/createRandomNumber";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CreateRoomModal } from "./create-room-modal"
import { JoinRoomModal } from "./join-room-modal"
import { AvailableRooms } from "./available-rooms"

export default function GameRoom({ params }: { params: { game: string } }) {
  const [isCreateRoomModalOpen, setCreateRoomModalOpen] = useState(false)
  const [isJoinRoomModalOpen, setJoinRoomModalOpen] = useState(false)
  const [rooms, setRooms] = useState<string[]>([])
  const router = useRouter()
  const { game } = params

  useEffect(() => {
    const handleHasRoom = (roomList: string[]) => {
      setRooms(roomList)
    }

    socket.on('connect', () => {
      console.log('Connected with ID:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected with ID:', socket.id)
    })

    socket.emit('existroom', game)
    socket.on('hasroom', handleHasRoom)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('hasroom', handleHasRoom)
    }
  }, [game])

  const handleCreateRoom = () => {
    const roomId = createRandomNumber()
    socket.emit(`create${game}Room`, roomId, socket.id)
    router.push(`/${game}/${roomId}`)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
        <Button 
          onClick={() => setCreateRoomModalOpen(true)}
          className="h-80 text-2xl font-bold bg-primary/90 hover:bg-primary/100 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          ルームを作成
        </Button>
        <Button 
          onClick={() => setJoinRoomModalOpen(true)}
          className="h-80 text-2xl font-bold bg-primary/90 hover:bg-primary/100 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          ルームに参加
        </Button>
      </div>
      <CreateRoomModal 
        isOpen={isCreateRoomModalOpen} 
        onClose={() => setCreateRoomModalOpen(false)} 
        onCreateRoom={handleCreateRoom}
      />
      <JoinRoomModal 
        isOpen={isJoinRoomModalOpen} 
        onClose={() => setJoinRoomModalOpen(false)} 
        game={game}
      />
      <AvailableRooms rooms={rooms} />
    </div>
  )
}

