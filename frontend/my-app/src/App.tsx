import React, { useState, useEffect } from "react";
import { 
  TelepartyClient, 
  SocketEventHandler, 
  SocketMessageTypes, 
  SessionChatMessage,
  MessageList
} from "teleparty-websocket-lib";

// Manually define missing interfaces
interface SendMessageData {
  body: string;
}

interface TypingMessageData {
  anyoneTyping: boolean;
  usersTyping: string[];
}

const App: React.FC = () => {
  const [client, setClient] = useState<TelepartyClient | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInSession, setIsInSession] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        //console.log("Connected to WebSocket");
        setIsConnected(true);
      },

      onClose: () => {
        //console.log("WebSocket disconnected");
        setIsConnected(false);
        setIsInSession(false);
      },

      onMessage: (msg: any) => {
        //console.log("Received message:", msg);

        if (msg.type === SocketMessageTypes.SEND_MESSAGE) {
          const chatMessage = msg?.data as SessionChatMessage;
          setMessages((prev) => [...prev, chatMessage]);
        } 
        
        else if (msg.type === SocketMessageTypes.SET_TYPING_PRESENCE) {
          const typingData = msg?.data as TypingMessageData;
          setIsTyping(typingData.anyoneTyping);
        } 

      },
    };

    const tpClient = new TelepartyClient(eventHandler);
    setClient(tpClient);
  }, []);

  const createRoom = async () => {
    if (client && nickname && !isInSession) {
      const newRoomId = await client.createChatRoom(nickname, "");
      //console.log(`Room Created: ${newRoomId}`);
      setRoomId(newRoomId);
      setIsInSession(true);
    }
  };

  const joinRoom = async () => {
    if (client && roomId && nickname && !isInSession) {
      //console.log(`Joining Room: ${roomId} as ${nickname}`);
      const messageList = await client.joinChatRoom(nickname, roomId, "");
      setMessages(messageList.messages);
      setIsInSession(true);
    }
  };

  const sendMessage = () => {
    if (client && message.trim()) {
      const messageData: SendMessageData = { body: message };
      client.sendMessage(SocketMessageTypes.SEND_MESSAGE, messageData);
      setMessage("");

      // Stop typing indicator
      client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing: false });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    client?.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing: e.target.value.length > 0 });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Real-Time Chat</h1>
      {!isConnected && <p>Connecting...</p>}

      <div className="flex gap-2 my-2">
        <input 
          type="text" 
          placeholder="Enter nickname" 
          value={nickname} 
          onChange={(e) => setNickname(e.target.value)} 
          className="border p-2"
        />
        <button onClick={createRoom} className="bg-blue-500 text-white p-2" disabled={isInSession}>Create Room</button>
      </div>

      <div className="flex gap-2 my-2">
        <input 
          type="text" 
          placeholder="Enter Room ID" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          className="border p-2"
        />
        <button onClick={joinRoom} className="bg-green-500 text-white p-2" disabled={isInSession}>Join Room</button>
      </div>

      <div className="border p-2 my-4 h-60 overflow-auto">
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.userNickname || "Unknown"}:</strong> {msg.body}</p>
        ))}
        {isTyping && <p className="text-gray-500 italic">Someone is typing...</p>}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={message} 
          onChange={handleTyping} 
          className="border p-2 flex-1"
        />
        <button onClick={sendMessage} className="bg-purple-500 text-white p-2">Send</button>
      </div>
    </div>
  );
};

export default App;
