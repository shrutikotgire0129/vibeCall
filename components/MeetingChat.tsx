"use client";

import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { StreamChat, type Channel as StreamChannel } from "stream-chat";

import { generateChatToken } from "@/actions/stream.actions";

const MeetingChat = ({
  callId,
  onClose,
}: {
  callId: string;
  onClose: () => void;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      userId: string;
    }>
  >([]);

  useEffect(() => {
    let client: StreamChat | null = null;

    const setupChat = async () => {
      try {
        const { token, userId, apiKey } = await generateChatToken();

        client = StreamChat.getInstance(apiKey);

        await client.connectUser(
          {
            id: userId,
          },
          token,
        );

        const currentChannel = client.channel("messaging", `meeting-${callId}`);

        await currentChannel.watch();

        setChatClient(client);
        setChannel(currentChannel);

        setMessages(
          currentChannel.state.messages.map((msg) => ({
            id: msg.id,
            text: msg.text || "",
            userId: msg.user?.id || "",
          })),
        );

        currentChannel.on("message.new", (event) => {
          if (!event.message) return;

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === event.message!.id)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: event.message!.id,
                text: event.message!.text || "",
                userId: event.message!.user?.id || "",
              },
            ];
          });
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    setupChat();

    return () => {
      if (client && client.userID) {
        client.disconnectUser();
      }
    };
  }, [callId]);

  const handleSendMessage = async () => {
    if (!channel || !message.trim()) return;

    try {
      await channel.sendMessage({
        text: message.trim(),
      });

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!chatClient || !channel) {
    return (
      <div className="flex h-full items-center justify-center bg-dark-1 text-white">
        Loading chat...
      </div>
    );
  }

  const currentUserId = chatClient.userID;

  return (
    <div className="flex h-full flex-col bg-dark-1 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <h2 className="text-lg font-semibold">Meeting Chat</h2>

        <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/50">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isOwnMessage
                      ? "bg-blue-1 text-white"
                      : "bg-dark-3 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-dark-3 p-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/40"
          />

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="rounded-lg bg-blue-1 p-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;
