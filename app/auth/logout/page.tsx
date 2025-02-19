"use client";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { axiosInstance, logoutUser } from "@/app/config/axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/user-store";

const Logout = () => {
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );

      await fetch("/api/auth/reset-token", {
        method: "POST",
      });

      localStorage.removeItem("accessToken");

      return response.data;
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
      logoutUser();
      useUserStore.getState().setUser(null);
      router.push("/auth/login");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error.response?.data?.errors[0] || "Logout failed. Please try again."
      );
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Logout</h1>

          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Are you sure you want to sign out?
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleLogout} disabled={logoutMutation.isPending}>
            {logoutMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader size={20} isLoading={logoutMutation.isPending} />
                <span>Logging out...</span>
              </div>
            ) : (
              "Logout"
            )}
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" disabled={logoutMutation.isPending}>
              Cancel
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logout;
