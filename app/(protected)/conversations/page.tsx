"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  MessageSquare,
  Search,
  ArrowLeft,
  Bot,
  User,
} from "lucide-react";
import { axiosInstance } from "@/app/config/axios";
import { Loader } from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

const ConversationsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get("/conversations");
      console.log("API Response:", response.data);
      return response.data;
    },
  });

  const getLastMessage = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "No messages";
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.trim();

    // Remove markdown syntax for preview
    const cleanContent = content
      .replace(/[#*`_~\[\]]/g, "") // Remove markdown symbols
      .replace(/\n/g, " ") // Replace newlines with spaces
      .trim();

    // Truncate to 100 characters
    return cleanContent.length > 100
      ? `${cleanContent.slice(0, 100)}...`
      : cleanContent;
  };

  const formatTitle = (title: string) => {
    return title.replace("conv_", "Conversation ").slice(0, 30);
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Convert the data to an array if it's a single conversation
  const conversations = Array.isArray(data?.data)
    ? data.data
    : data?.data
    ? [data.data]
    : [];

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const renderMessage = (message: Message) => {
    const isAI = message.role === "ai";
    return (
      <div
        key={message.timestamp}
        className={cn(
          "flex w-full py-4",
          isAI ? "bg-accent/30" : "bg-background"
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
              <p className="text-sm font-medium text-muted-foreground">
                {isAI ? "AI Assistant" : "You"}
              </p>
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
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(message.timestamp), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-8">
        {selectedConversation ? (
          <div className="relative">
            <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg mb-6">
              <div className="p-4 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold truncate">
                    {formatTitle(selectedConversation.title)}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.messages.length} messages
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/50 rounded-lg border bg-background/50 backdrop-blur-sm">
              {selectedConversation.messages.map(renderMessage)}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b">
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Conversations
                </h1>
                <p className="text-muted-foreground mt-2">
                  Your chat history with the AI financial assistant
                </p>
              </div>
              <div className="w-96">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10 bg-background/50 backdrop-blur-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader size={30} isLoading={true} />
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredConversations.length === 0 ? (
                  <Card className="py-16 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 rounded-full bg-primary/5">
                        <MessageSquare className="h-8 w-8 text-primary/50" />
                      </div>
                      <div className="text-center space-y-2">
                        <CardTitle className="text-xl text-muted-foreground">
                          {searchQuery
                            ? "No conversations found matching your search"
                            : "No conversations yet"}
                        </CardTitle>
                        <CardDescription>
                          {searchQuery
                            ? "Try adjusting your search terms"
                            : "Start chatting with the AI assistant to see your conversations here"}
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
                  <div className="grid gap-4">
                    {filteredConversations.map((conversation) => (
                      <Card
                        key={conversation._id}
                        className="cursor-pointer hover:bg-accent/50 transition-all duration-300 hover:shadow-md group"
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1 min-w-0">
                              <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                {formatTitle(conversation.title)}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                                {getLastMessage(conversation.messages)}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-3 pl-4">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(
                                  new Date(conversation.updatedAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:transform group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
