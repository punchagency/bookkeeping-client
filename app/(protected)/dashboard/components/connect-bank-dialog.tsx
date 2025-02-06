/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useCallback } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/app/config/axios";
import { toast } from "sonner";
import { Loader } from "@/components/loader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBankConnected?: (data: { userGuid: string; memberGuid: string }) => void;
}

export function ConnectBankDialog({
  open,
  onOpenChange,
  onBankConnected,
}: Readonly<Props>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const connectBankMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post("/bank/connect");
      return response.data.data._value.widget_url;
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.errors[0] ||
          "Failed to load widget. Please try again."
      );
    },
  });

  const handleMXEvent = useCallback(
    (event: MessageEvent) => {
      if (!event.data || event.data.mx !== true) return;

      console.log("MX Event:", event.data);

      switch (event.data.type) {
        case "mx/connect/memberConnected":
          toast.success("Bank connected successfully!");
          onBankConnected?.({
            userGuid: event.data.metadata.user_guid,
            memberGuid: event.data.metadata.member_guid,
          });

          onOpenChange(false);
          break;

        case "mx/connect/loaded":
          console.log("MX Widget loaded");
          break;

        case "mx/connect/connectionFailed":
          toast.error("Failed to connect to bank. Please try again.");
          break;

        case "mx/connect/memberDeleted":
          toast.info("Bank connection removed");
          break;
      }
    },
    [onBankConnected, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      connectBankMutation.mutate();
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener("message", handleMXEvent);

    return () => {
      window.removeEventListener("message", handleMXEvent);
    };
  }, [handleMXEvent]);

  const Content = connectBankMutation.isPending ? (
    <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
      <Loader size={30} isLoading={true} />
      <p className="text-muted-foreground">Loading connection widget...</p>
    </div>
  ) : connectBankMutation.data ? (
    <iframe
      src={connectBankMutation.data.url}
      className="w-full h-[600px] border-none"
      allow="camera"
      title="MX Connect Widget"
    />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[700px]">
          <DialogHeader>
            <DialogTitle>Connect Your Bank</DialogTitle>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect Your Bank</DrawerTitle>
        </DrawerHeader>
        {Content}
      </DrawerContent>
    </Drawer>
  );
}
