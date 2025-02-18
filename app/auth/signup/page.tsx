/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { axiosInstance } from "@/app/config/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  otpDeliveryMethod: "EMAIL" | "PHONE_NUMBER";
}

const Signup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    otpDeliveryMethod: "PHONE_NUMBER",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axiosInstance.post("/auth/signup", {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        otpDeliveryMethod: data.otpDeliveryMethod,
      });
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response.message);

      const urlParams =
        formData.otpDeliveryMethod === "EMAIL"
          ? "email=" + formData.email
          : "phoneNumber=" + formData.phoneNumber;

      router.push(`/auth/verify-otp?${urlParams}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.errors?.[0] ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create account. Please try again.";

      toast.error(errorMessage);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOtpMethodChange = (value: "EMAIL" | "PHONE_NUMBER") => {
    setFormData((prev) => ({
      ...prev,
      otpDeliveryMethod: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signupMutation.mutate(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Create Account</h1>
          <p className="text-sm text-gray-500 text-center">
            Enter your details to create your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  disabled={signupMutation.isPending}
                />
                <p className="text-xs text-gray-500">
                  We'll send a verification code to this email
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  disabled={signupMutation.isPending}
                />
              </div>
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
                disabled={signupMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Method</label>
              <Select
                value={formData.otpDeliveryMethod}
                onValueChange={handleOtpMethodChange}
                disabled={signupMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select verification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Verify via Email</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PHONE_NUMBER">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Verify via SMS</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.otpDeliveryMethod === "EMAIL"
                  ? "We'll send a verification code to your email address"
                  : "We'll send a verification code to your phone number"}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader size={20} isLoading={signupMutation.isPending} />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
