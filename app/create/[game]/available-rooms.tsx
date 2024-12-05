import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AvailableRoomsProps {
  rooms: string[]
}

export function AvailableRooms({ rooms }: AvailableRoomsProps) {
  return (
    <Card className="w-full max-w-4xl mt-6">
      <CardHeader>
        <CardTitle>利用可能なルーム</CardTitle>
      </CardHeader>
      <CardContent>
        {rooms.length > 0 ? (
          <ul className="space-y-2">
            {rooms.map((room, index) => (
              <li key={index} className="p-2 bg-secondary rounded-md">
                ルームID: {room}
              </li>
            ))}
          </ul>
        ) : (
          <p>現在利用可能なルームはありません。</p>
        )}
      </CardContent>
    </Card>
  )
}

