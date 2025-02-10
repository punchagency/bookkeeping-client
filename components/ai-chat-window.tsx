import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AIChatWindowProps {
  messages: Message[];
  className?: string;
}

export function AIChatWindow({ messages, className }: AIChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // console.log("Rendering chat window with messages:", messages);
  useEffect(() => {
    //  console.log("Messages updated:", messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // console.log("Chat window messages:", messages); // Debug log

  return (
    <div
      className={cn(
        "fixed top-20 right-6 w-[350px] h-[500px]",
        "bg-white dark:bg-gray-800",
        "rounded-xl shadow-xl border-2",
        "flex flex-col",
        "z-[9999]", // Very high z-index to ensure visibility
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
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-2 w-full mb-4",
              message.role === "ai" ? "justify-start" : "justify-end"
            )}
          >
            {message.role === "ai" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 max-w-[80%]",
                message.role === "ai"
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "bg-blue-500 text-white"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-[10px] opacity-50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {message.role === "user" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
