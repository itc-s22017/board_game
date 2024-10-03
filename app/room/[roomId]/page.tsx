'use client';
import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket'; // シングルトンインスタンスをインポート

const ChatPage = ({ params }: { params: { roomId: string } }) => {
  const [messages, setMessages] = useState<{ id: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const roomId = params.roomId;

  useEffect(() => {
    // メッセージ受信のリスナーを登録
    const handleReceiveMessage = (messageData: { id: string; message: string }) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
      console.log('Received message:', messageData); // メッセージ受信時にコンソールにログ出力
    };

    socket.on('receiveMessage', handleReceiveMessage);

    // クリーンアップ関数でリスナーを解除
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message to room:', roomId); // メッセージ送信時にコンソールにログ出力
      socket.emit('sendMessage', roomId, newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex flex-col space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className="p-2 bg-white rounded-md shadow-sm">
              <strong>{msg.id}</strong>: {msg.message}
            </div>
          ))}
          {roomId ?? 's'}
        </div>
      </div>
      <div className="p-4 bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-md"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
