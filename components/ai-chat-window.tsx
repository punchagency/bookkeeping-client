import { cn } from "@/lib/utils";
import { Bot, Minus, Maximize2, X } from "lucide-react";
import { useRef, useEffect, useState, MouseEvent } from "react";
import { ChatMessage, Message } from "./chat-message";
import { Button } from "./ui/button";

interface AIChatWindowProps {
  messages: Message[];
  className?: string;
  onClose?: () => void;
}

export function AIChatWindow({
  messages,
  className,
  onClose,
}: Readonly<AIChatWindowProps>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Debug log
  console.log("AIChatWindow rendered:", { messages, position });

  useEffect(() => {
    // Set initial position
    if (messages.length > 0) {
      console.log("Messages received:", messages);
      const x = window.innerWidth - (isMinimized ? 350 : 800) - 24;
      const y = 80;
      setPosition({ x, y });
    }
  }, [messages.length, isMinimized]);

  // If no messages, still render but with debug info
  if (!messages.length) {
    console.log("No messages received");
    return null;
  }

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
          AI Conversation ({messages.length})
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
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
