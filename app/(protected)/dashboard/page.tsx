/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import dayjs from "dayjs";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConnectBankDialog } from "./components/connect-bank-dialog";
import {
  PlusCircle,
  Building2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
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

  const handleBankConnected = ({
    userGuid,
    memberGuid,
  }: {
    userGuid: string;
    memberGuid: string;
  }) => {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your accounts
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      ) : banks && banks.length > 0 ? (
        <div className="grid gap-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectBank(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Bank
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {banks.map((bank) => (
              <Card key={bank.guid}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        {bank.name}
                      </CardTitle>
                      <CardDescription>
                        Institution Code: {bank.institutionCode}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(bank.connectionStatus)}>
                      {bank.connectionStatus === "CONNECTED" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : bank.connectionStatus === "PENDING" ? (
                        <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {bank.connectionStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Member ID
                    </div>
                    <div className="font-mono text-sm">{bank.guid}</div>
                    {bank.lastSuccessfulUpdate && (
                      <>
                        <div className="text-sm text-muted-foreground mt-4">
                          Last Updated
                        </div>
                        <div className="flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {dayjs(bank.lastSuccessfulUpdate).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>No Bank Connected</CardTitle>
              <CardDescription>
                Connect your bank account to start tracking your finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;ll be able to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>View all your accounts in one place</li>
                    <li>Track your spending</li>
                    <li>Monitor your balances</li>
                  </ul>
                </p>
                <Button
                  onClick={() => setShowConnectBank(true)}
                  className="w-full sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Connect Your Bank
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
