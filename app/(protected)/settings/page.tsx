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

const allowedVoices = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
];

const Settings = () => {
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem("aiVoice") || "alloy";
  });

  useEffect(() => {
    localStorage.setItem("aiVoice", selectedVoice);
  }, [selectedVoice]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Change your AI voice settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Voice Selection</CardTitle>
          <CardDescription>
            Choose the voice that ChatGPT will use when speaking to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          <Button
            className="mt-4"
            onClick={() => alert(`Voice set to: ${selectedVoice}`)}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
