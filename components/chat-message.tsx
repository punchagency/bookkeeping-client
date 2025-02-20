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
      <div
        className={cn(
          "group hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1",
          className
        )}
      >
        <div className="flex gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm">AI Assistant</span>
              <span className="text-[11px] text-muted-foreground">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
            <div className="mt-1 max-w-2xl">
              <ChartRenderer
                type={chartData.type}
                data={chartData.data}
                options={{
                  ...chartData.options,
                  height: 400,
                  width: undefined,
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1",
        className
      )}
    >
      <div className="flex gap-2">
        {isAI ? (
          <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {isAI ? "AI Assistant" : "You"}
            </span>
            {showConversationInfo && message.conversationTitle && (
              <>
                <span className="text-[11px] text-muted-foreground">in</span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatTitle(message.conversationTitle)}
                </span>
              </>
            )}
            <span className="text-[11px] text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div
            className={cn(
              "mt-0.5 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              isAI
                ? "[&_pre]:bg-gray-100 dark:[&_pre]:bg-gray-800 [&_pre]:p-3 [&_pre]:rounded-md [&_code]:text-sm [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-gray-300 dark:[&_table_th]:border-gray-600 [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-gray-300 dark:[&_table_td]:border-gray-600 [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
                : "[&_pre]:bg-blue-50 dark:[&_pre]:bg-blue-900/20 [&_pre]:p-3 [&_pre]:rounded-md [&_code]:text-sm [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-blue-200 [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-blue-200 [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
