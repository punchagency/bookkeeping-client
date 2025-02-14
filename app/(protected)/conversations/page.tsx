"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { MessageSquare, Search, Bot, User, Filter, Check } from "lucide-react";
import { axiosInstance } from "@/app/config/axios";
import { Loader } from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface MessageWithConversation extends Message {
  conversationId: string;
  conversationTitle: string;
}

interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  code: number;
  status: string;
  success: boolean;
  message: string;
  data: Conversation[] | Conversation;
}

interface GroupedMessages {
  [key: string]: MessageWithConversation[];
}

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

const ConversationsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOption>("oldest");

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get("/conversations");
      console.log("API Response:", response.data);
      return response.data;
    },
  });

  useEffect(() => {
    if (!isLoading && data) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [data, isLoading, searchQuery]);

  const formatTitle = (title: string) => {
    return title.replace("conv_", "Conversation ").slice(0, 30);
  };

  const conversations = Array.isArray(data?.data)
    ? data.data
    : data?.data
    ? [data.data]
    : [];

  const allMessages = conversations.flatMap((conv) =>
    conv.messages.map((msg) => ({
      ...msg,
      conversationId: conv._id,
      conversationTitle: conv.title,
    }))
  );

  const groupMessagesByDate = (messages: MessageWithConversation[]) => {
    const groups: GroupedMessages = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp);
      const dateKey = date.toLocaleDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(allMessages);
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const renderMessage = (message: MessageWithConversation) => {
    const isAI = message.role === "ai";
    return (
      <div
        key={`${message.conversationId}-${message.timestamp}`}
        className={cn(
          "flex w-full py-4 hover:bg-accent/10 group transition-colors",
          isAI ? "bg-accent/5" : "bg-background"
        )}
      >
        <div className="container max-w-5xl mx-auto px-6">
          <div className="flex gap-4 items-start">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isAI ? "bg-primary/10" : "bg-primary text-primary-foreground"
              )}
            >
              {isAI ? (
                <Bot className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {isAI ? "AI Assistant" : "You"}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  from {formatTitle(message.conversationTitle)}
                </span>
              </div>
              <div
                className={cn(
                  "prose prose-sm max-w-none dark:prose-invert",
                  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                  isAI
                    ? "[&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-md [&_code]:text-sm [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-border [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-border [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
                    : "[&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-border [&_table_th]:px-2 [&_table_th]:py-1 [&_table_td]:border [&_table_td]:border-border [&_table_td]:px-2 [&_table_td]:py-1 [&_table]:my-2"
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Conversations
            </h1>
            <p className="text-muted-foreground mt-2">
              Your chat history with the AI financial assistant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {sortOrder === "newest" ? "Newest first" : "Oldest first"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  {sortOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      className="w-full justify-start font-normal"
                      onClick={() => setSortOrder(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          sortOrder === option.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10 bg-background/50 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader size={30} isLoading={true} />
          </div>
        ) : allMessages.length === 0 ? (
          <Card className="py-16 border-dashed">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/5">
                <MessageSquare className="h-8 w-8 text-primary/50" />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-xl text-muted-foreground">
                  {searchQuery
                    ? "No messages found matching your search"
                    : "No messages yet"}
                </CardTitle>
                <CardDescription>
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Start chatting with the AI assistant to see your messages here"}
                </CardDescription>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => {
              const messages = groupedMessages[date].filter((msg) =>
                msg.content.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (messages.length === 0) return null;

              return (
                <div key={date} className="space-y-2">
                  <div className="sticky top-24 bg-background/80 backdrop-blur-sm z-10 py-2">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-border" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                  <div className="divide-y divide-border/50 rounded-lg border bg-background/50 backdrop-blur-sm">
                    {messages.map(renderMessage)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
