import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import socket from "@/app/utils/socket"

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
  game: string
}

export function JoinRoomModal({ isOpen, onClose, game }: JoinRoomModalProps) {
  const [roomId, setRoomId] = useState("")
  const router = useRouter()


  useEffect(() => {
    const handleJoinRoomResponse = (response: { success: boolean, isMax: boolean }) => {
      if (response.success) {
        router.push(`/${game}/${roomId}`)
        onClose()
      } else {
        if (response.isMax) {
          alert('人数がいっぱいです')
        } else {
          alert("ルームが存在しません")
        }
      }
    }

    socket.on("RoomResponse", handleJoinRoomResponse)

    return () => {
      socket.off("RoomResponse", handleJoinRoomResponse)
    }
  }, [roomId, router, onClose, game])

  const handleJoinRoom = () => {
    if (roomId.trim() !== "") {
      socket.emit(`checkRoom`, roomId, game)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ルームに参加</DialogTitle>
          <DialogDescription>
            参加したいルームのIDを入力してください。
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          placeholder="ルームID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <DialogFooter>
          <Button onClick={handleJoinRoom}>参加</Button>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

