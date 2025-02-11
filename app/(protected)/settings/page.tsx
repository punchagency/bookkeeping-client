"use client";
import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { axiosInstance } from "@/app/config/axios";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

const allowedVoices = [
  { id: "alloy", name: "Alloy" },
  { id: "ash", name: "Ash" },
  { id: "coral", name: "Coral" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "sage", name: "Sage" },
  { id: "shimmer", name: "Shimmer" },
];

const Settings = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [selectedVoice, setSelectedVoice] = useState<string>();
  const [fullName, setFullName] = useState(user?.fullName || "");

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      const response = await axiosInstance.patch("/user/profile", data);
      return response.data;
    },
    onSuccess: (response) => {
      if (user) {
        setUser({ ...user, fullName: response.data.fullName });
      }
      toast.success("Profile updated successfully!");
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
    updateProfileMutation.mutate({ fullName });
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    // TODO: Implement voice preference saving to backend
    toast.success(`Voice set to: ${value}`);
  };

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
            View and update your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.avatar && (
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="h-20 w-20 rounded-full"
              />
              <p className="text-sm text-muted-foreground">
                Profile picture can only be updated through your account
                provider
              </p>
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
              value={user?.email || ""}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Voice Settings</CardTitle>
          <CardDescription>
            Choose the voice that ChatGPT will use when speaking to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedVoice} onValueChange={handleVoiceChange}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
