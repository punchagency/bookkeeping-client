import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { useRef, useEffect } from "react";
import { ChatMessage, Message } from "./chat-message";

interface AIChatWindowProps {
  messages: Message[];
  className?: string;
}

export function AIChatWindow({
  messages,
  className,
}: Readonly<AIChatWindowProps>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "fixed top-20 right-6 w-[350px] h-[500px]",
        "bg-white dark:bg-gray-800",
        "rounded-xl shadow-xl border-2",
        "flex flex-col",
        "z-[9999]",
        "transition-all duration-300",
        messages.length === 0
          ? "opacity-0 pointer-events-none scale-95"
          : "opacity-100 scale-100",
        className
      )}
    >
      <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-t-xl">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI Conversation
        </h3>
        <span className="text-xs text-muted-foreground">
          {messages.length} messages
        </span>
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
