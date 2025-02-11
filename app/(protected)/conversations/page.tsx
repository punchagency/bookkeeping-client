"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, MessageSquare } from "lucide-react";
import { axiosInstance } from "@/app/config/axios";
import { Loader } from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Conversation {
  _id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

const ConversationsPage = () => {
  const router = useRouter();

  const { data, isLoading } = useQuery<ConversationsResponse>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get("/conversations");
      return response.data.data;
    },
  });

  const handleConversationClick = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground">
          Your chat history with the AI assistant
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader size={30} isLoading={true} />
        </div>
      ) : (
        <div className="grid gap-4">
          {!data?.conversations?.length ? (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <CardTitle className="text-xl text-muted-foreground">
                    No conversations found
                  </CardTitle>
                  <CardDescription>
                    Start chatting with the AI assistant to see your
                    conversations here
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ) : (
            data.conversations.map((conversation) => (
              <Card
                key={conversation._id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleConversationClick(conversation._id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle>{conversation.title}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {conversation.lastMessage}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(conversation.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination will be added here later */}
      <div className="h-20" />
    </div>
  );
};

export default ConversationsPage;
