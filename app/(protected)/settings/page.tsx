/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/user-store";
import { axiosInstance } from "@/app/config/axios";
import { Loader } from "@/components/loader";

const allowedVoices = [
  { id: "alloy", name: "Alloy" },
  { id: "ash", name: "Ash" },
  { id: "ballad", name: "Ballad" },
  { id: "coral", name: "Coral" },
  { id: "echo", name: "Echo" },
  { id: "sage", name: "Sage" },
  { id: "shimmer", name: "Shimmer" },
  { id: "verse", name: "Verse" },
];

const Settings = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [selectedVoice, setSelectedVoice] = useState<string>();
  const [fullName, setFullName] = useState("");

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await axiosInstance.get("/settings");
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFullName(settings.fullName);
      setSelectedVoice(settings.voice);
      setUser({
        _id: user?._id || "",
        email: settings.email,
        fullName: settings.fullName,
        avatar: settings.avatar,
      });
    }
  }, [settings, setUser, user?._id]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; voice: string }) => {
      const response = await axiosInstance.put("/settings", data);
      return response.data;
    },
    onSuccess: async (response: any) => {
      await refetch();
      toast.success(response.message ?? "Profile updated successfully!");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    },
  });

  const handleUpdateProfile = () => {
    if (!fullName.trim()) {
      return toast.error("Name cannot be empty");
    }
    if (!selectedVoice) {
      return toast.error("Please select a voice");
    }
    updateProfileMutation.mutate({ fullName, voice: selectedVoice });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              View and update your profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-8">
              <Loader size={30} isLoading={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            View and update your profile information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.avatar && (
            <div className="flex items-center space-x-4">
              <img
                src={settings.avatar}
                alt={settings.fullName}
                className="h-14 w-14 rounded-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              value={settings?.email || ""}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="voice" className="text-sm font-medium">
              AI Assistant Voice
            </label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {allowedVoices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This voice will be used when the AI assistant speaks to you
            </p>
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
