/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { axiosInstance } from "@/app/config/axios";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyOTP = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/auth/login");
    }
  }, [router, searchParams]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isResendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    if (countdown === 0) {
      setIsResendDisabled(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [isResendDisabled, countdown]);

  const verifyMutation = useMutation({
    mutationFn: async (otp: string) => {
      const response = await axiosInstance.post("/auth/verify-otp", {
        otp,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Account verified successfully!");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.errors?.[0] ||
        error.response?.data?.message ||
        error.message ||
        "Failed to verify OTP. Please try again.";

      toast.error(errorMessage);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post("/auth/resend-otp", {
        email: email,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("New OTP has been sent to your email");
      setOtp("");
      setIsResendDisabled(true);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        "Failed to resend OTP. Please try again.";

      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error("Please enter a valid 6-digit OTP");
    }
    verifyMutation.mutate(otp);
  };

  const handleResendOtp = () => {
    if (!email) {
      return toast.error("Please try verifying an OTP first");
    }
    resendMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">
            Verify Your Account
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Please enter the 6-digit OTP sent to your email
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot className="w-12 h-12 text-lg" index={0} />
                    <InputOTPSlot className="w-12 h-12 text-lg" index={1} />
                    <InputOTPSlot className="w-12 h-12 text-lg" index={2} />
                    <InputOTPSlot className="w-12 h-12 text-lg" index={3} />
                    <InputOTPSlot className="w-12 h-12 text-lg" index={4} />
                    <InputOTPSlot className="w-12 h-12 text-lg" index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending || otp.length !== 6}
              >
                {verifyMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader size={20} isLoading={verifyMutation.isPending} />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify Account"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the code?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={handleResendOtp}
              disabled={isResendDisabled || resendMutation.isPending}
            >
              {isResendDisabled
                ? `Try again in ${countdown}s`
                : resendMutation.isPending
                ? "Sending..."
                : "Click to resend"}
            </Button>
          </p>
          <p className="text-xs text-gray-400">The OTP will expire in 1 hour</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyOTP;
