"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardMetrics } from "./components/dashboard-metrics";
import { ConnectBankDialog } from "./components/connect-bank-dialog";
import { CreateMxUser } from "./components/create-mx-user";
import { PlusCircle } from "lucide-react";
import { axiosInstance } from "@/app/config/axios";
import type { User, ConnectedBank } from "./types";

const Dashboard = () => {
  const [showConnectBank, setShowConnectBank] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your accounts
          </p>
        </div>

        <br />
        <Button
          onClick={() => setShowConnectBank(true)}
          className="w-full md:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Connect Bank
        </Button>

        <ConnectBankDialog open={showConnectBank} onOpenChange={setShowConnectBank} />
      </div>
    </div>
  );
};

export default Dashboard;
