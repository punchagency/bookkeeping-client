import { cn } from "@/lib/utils";
import { Bot, Minus, Maximize2, X } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { ChatMessage, Message } from "./chat-message";
import { Button } from "./ui/button";

interface AIChatWindowProps {
  messages: Message[];
  className?: string;
  onClose?: () => void;
  streamingMessage?: string;
  isAITyping?: boolean;
  isAISpeaking?: boolean;
}

export function AIChatWindow({
  messages,
  className,
  onClose,
  streamingMessage = "",
  isAITyping = false,
  isAISpeaking = false,
}: Readonly<AIChatWindowProps>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Debug log
  console.log("AIChatWindow rendered:", { messages, position });

  useEffect(() => {
    // Set initial position when first message arrives
    if (messages.length > 0 || streamingMessage) {
      const x = window.innerWidth - (isMinimized ? 350 : 800) - 24;
      const y = 80;
      setPosition({ x, y });
    }
  }, [messages.length, isMinimized, streamingMessage]);

  // Scroll to bottom when new messages arrive or streaming message updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  // Show the window if there are messages or if AI is typing
  if (!messages.length && !streamingMessage && !isAITyping) {
    return null;
  }

  // Filter out any user messages that were added while AI was speaking
  const filteredMessages = messages.filter((msg, index) => {
    if (msg.role === "user") {
      // Get the previous message
      const prevMsg = messages[index - 1];
      // If this user message was created while AI was speaking in the previous message,
      // and the time difference is very small (less than 2 seconds), filter it out
      if (prevMsg && prevMsg.role === "ai") {
        const timeDiff =
          new Date(msg.timestamp).getTime() -
          new Date(prevMsg.timestamp).getTime();
        if (timeDiff < 2000) {
          // 2 seconds threshold
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div
      className={cn(
        "fixed top-20 right-6",
        "bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2",
        "flex flex-col z-[9999]",
        isMinimized ? "w-[350px] h-[500px]" : "w-[800px] h-[600px]",
        className
      )}
    >
      <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-t-xl">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI Conversation ({filteredMessages.length})
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-red-500"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredMessages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isStreaming={
              message.role === "ai" &&
              isAISpeaking &&
              index === filteredMessages.length - 1
            }
          />
        ))}
        {(streamingMessage || isAITyping) && !isAISpeaking && (
          <ChatMessage
            message={{
              role: "ai",
              content: streamingMessage || "...",
              timestamp: new Date().toISOString(),
            }}
            isStreaming={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
