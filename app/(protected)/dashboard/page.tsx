"use client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  PlusCircle,
  Building2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Unlink,
} from "lucide-react";
import { axiosInstance } from "@/app/config/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ConnectBankDialog } from "./components/connect-bank-dialog";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

interface ConnectedBank {
  guid: string;
  institutionCode: string;
  name: string;
  connectionStatus: string;
  lastSuccessfulUpdate: string;
}

const Dashboard = () => {
  const [showConnectBank, setShowConnectBank] = useState(false);
  const queryClient = useQueryClient();

  const { data: banks, isLoading } = useQuery({
    queryKey: ["bank-current"],
    queryFn: async () => {
      const response = await axiosInstance.get("/bank/current");
      return response.data.data as ConnectedBank[];
    },
  });

  const disconnectBankMutation = useMutation({
    mutationFn: async (memberGuid: string) => {
      await axiosInstance.delete(`/bank/disconnect/`, {
        data: {
          memberGuid,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-current"] });
      toast.success("Bank disconnected successfully");
    },
    onError: (error) => {
      toast.error("Failed to disconnect bank");
      console.error("Error disconnecting bank:", error);
    },
  });

  const handleBankConnected = () => {
    queryClient.invalidateQueries({ queryKey: ["bank-current"] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "bg-green-500/15 text-green-700";
      case "DISCONNECTED":
        return "bg-red-500/15 text-red-700";
      case "PENDING":
        return "bg-yellow-500/15 text-yellow-700";
      default:
        return "bg-gray-500/15 text-gray-700";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your accounts
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      ) : banks && banks.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectBank(true)}
              className="shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Bank
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {banks.map((bank) => (
              <Card
                key={bank.guid}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        {bank.name}
                      </CardTitle>
                      <CardDescription>
                        Institution Code: {bank.institutionCode}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "px-2.5 py-1 rounded-md",
                          getStatusColor(bank.connectionStatus)
                        )}
                      >
                        {bank.connectionStatus === "CONNECTED" ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : bank.connectionStatus === "PENDING" ? (
                          <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {bank.connectionStatus}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Disconnect {bank.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will disconnect your bank account and stop
                              syncing transactions. You can always reconnect it
                              later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                disconnectBankMutation.mutate(bank.guid)
                              }
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {bank.lastSuccessfulUpdate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span>
                        Updated {dayjs(bank.lastSuccessfulUpdate).fromNow()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Connect Your First Bank</CardTitle>
            <CardDescription>
              Connect your bank account to start tracking your finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">All Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                      View all your accounts in one place
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <RefreshCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Auto-Sync</h3>
                    <p className="text-sm text-muted-foreground">
                      Transactions sync automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Easy Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect in just a few minutes
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowConnectBank(true)}
                size="lg"
                className="mt-4"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Connect Bank Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConnectBankDialog
        open={showConnectBank}
        onOpenChange={setShowConnectBank}
        onBankConnected={handleBankConnected}
      />
    </div>
  );
};

export default Dashboard;
