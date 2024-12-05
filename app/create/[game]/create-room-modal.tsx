import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: () => void
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ルームを作成</DialogTitle>
          <DialogDescription>
            新しいゲームルームを作成しますか？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onCreateRoom}>作成</Button>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

