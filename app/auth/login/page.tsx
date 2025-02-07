/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { toast } from "sonner";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader } from "@/components/loader";
import { axiosInstance } from "@/app/config/axios";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";

interface FormData {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    _id: string;
    email: string;
    fullName: string;
    avatar: string;
  };
  refreshToken: string;
}

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response: any = await axiosInstance.post<LoginResponse>(
        "/auth/login",
        data,
        {
          withCredentials: true,
        }
      );

      await fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.data.data.refreshToken }),
      });

      localStorage.setItem("accessToken", response.data.data.accessToken);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Login successful!");
      router.push("/dashboard");
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.errors[0] || "Login failed. Please try again."
      );
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Login</h1>
          <p className="text-sm text-gray-500 text-center">
            Enter your details to login into your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader size={20} isLoading={loginMutation.isPending} />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-500 hover:underline">
              Signup
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
