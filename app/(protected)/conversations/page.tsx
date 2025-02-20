"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  Filter,
  Check,
  Hash,
  Menu,
  X,
} from "lucide-react";
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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatMessage, Message } from "@/components/chat-message";

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
  [key: string]: (Message & {
    conversationId: string;
    conversationTitle: string;
  })[];
}

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

const formatTitle = (title: string) => {
  return title.replace("conv_", "Conversation ").slice(0, 30);
};

const ConversationsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOption>("oldest");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get("/conversations");
      return response.data;
    },
  });

  const conversations = Array.isArray(data?.data)
    ? data.data
    : data?.data
    ? [data.data]
    : [];

  // Sort conversations by updatedAt timestamp in descending order
  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Get messages for selected conversation or all messages if none selected
  const getFilteredMessages = () => {
    if (selectedConversation) {
      const conv = conversations.find((c) => c._id === selectedConversation);
      return conv
        ? conv.messages.map((msg) => ({
            ...msg,
            conversationId: conv._id,
            conversationTitle: conv.title,
          }))
        : [];
    }
    return conversations.flatMap((conv) =>
      conv.messages.map((msg) => ({
        ...msg,
        conversationId: conv._id,
        conversationTitle: conv.title,
      }))
    );
  };

  const allMessages = getFilteredMessages();

  const groupMessagesByDate = (
    messages: (Message & {
      conversationId: string;
      conversationTitle: string;
    })[]
  ) => {
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

  return (
    <div className="fixed inset-0 top-16 flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "w-72 border-r bg-gray-50 dark:bg-gray-900 flex flex-col absolute inset-y-0 lg:relative z-30",
          "transition-transform duration-300 ease-in-out lg:transition-none",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          "lg:w-64 lg:flex"
        )}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-2">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {sortedConversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => {
                setSelectedConversation(conv._id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2",
                selectedConversation === conv._id &&
                  "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{formatTitle(conv.title)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        <div className="border-b flex items-stretch">
          <Button
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-4 rounded-none h-auto lg:hidden hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1 flex items-center justify-between p-4">
            <h1 className="font-semibold">
              {selectedConversation
                ? formatTitle(
                    conversations.find((c) => c._id === selectedConversation)
                      ?.title || ""
                  )
                : "All Conversations"}
            </h1>
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-2 lg:px-4">
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
              <div className="space-y-4">
                {sortedDates.map((date) => {
                  const messages = groupedMessages[date].filter((msg) =>
                    msg.content
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  );

                  if (messages.length === 0) return null;

                  return (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 bg-white dark:bg-gray-950 py-2 z-10">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-border" />
                          <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
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
                      <div className="space-y-1">
                        {messages.map((message) => (
                          <ChatMessage
                            key={`${message.conversationId}-${message.timestamp}`}
                            message={message}
                            showConversationInfo={!selectedConversation}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
