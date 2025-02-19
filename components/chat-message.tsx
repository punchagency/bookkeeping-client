import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { ChartRenderer } from "./chart-renderer";
import { parseMessageContent } from "@/utils/message-parser";

export interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string | Date;
  conversationId?: string;
  conversationTitle?: string;
}

interface ChatMessageProps {
  message: Message;
  showConversationInfo?: boolean;
  className?: string;
}

const formatTitle = (title: string) => {
  return title?.replace("conv_", "Conversation ").slice(0, 30);
};

const formatTimestamp = (timestamp: string | Date): string => {
  try {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString();
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
};

export const ChatMessage = ({
  message,
  showConversationInfo = false,
  className,
}: ChatMessageProps) => {
  const isAI = message.role === "ai";
  const { text, chartData } = parseMessageContent(message.content);

  // If this is a chart response from AI, render only the chart
  if (isAI && chartData) {
    return (
      <div className={cn("flex gap-2 w-full justify-start", className)}>
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-3 h-3 text-primary" />
        </div>
        <div className="rounded-lg px-3 py-2 w-full max-w-2xl bg-gray-100 dark:bg-gray-700">
          <ChartRenderer
            type={chartData.type}
            data={chartData.data}
            options={{
              ...chartData.options,
              height: 400, // Set a good default height for visibility
              width: undefined, // Let it be responsive
              margin: { top: 40, right: 30, bottom: 60, left: 60 },
            }}
          />
          {text && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}
          <span className="text-[10px] opacity-50 mt-2 block">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 w-full",
        isAI ? "justify-start" : "justify-end",
        className
      )}
    >
      {isAI && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-3 h-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[80%]",
          isAI ? "bg-gray-100 dark:bg-gray-700" : "bg-blue-500 text-white"
        )}
      >
        {showConversationInfo && message.conversationTitle && (
          <div className="text-xs text-muted-foreground mb-1">
            from {formatTitle(message.conversationTitle)}
          </div>
        )}
        <div
          className={cn(
            "text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            isAI
              ? "[&_pre]:bg-gray-200 dark:[&_pre]:bg-gray-600 [&_pre]:p-2 [&_pre]:rounded-md [&_code]:text-sm [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-gray-300 dark:[&_table_th]:border-gray-600 [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-gray-300 dark:[&_table_td]:border-gray-600 [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
              : "text-white [&_a]:text-white [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-blue-400 [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-blue-400 [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
          >
            {text}
          </ReactMarkdown>
        </div>
        <span className="text-[10px] opacity-50 mt-1 block">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      {!isAI && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <User className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};
