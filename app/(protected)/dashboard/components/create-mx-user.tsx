"use client";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/app/config/axios";
import { toast } from "sonner";
import { Loader } from "@/components/loader";

export function CreateMxUser() {
  const queryClient = useQueryClient();

  const createMxUserMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post("/mx-user");
      return response.data;
    },
    onSuccess: () => {
      toast.success("MX User created successfully!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.refetchQueries({ queryKey: ["user"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error.response?.data?.errors[0] ||
          "Failed to create MX User. Please try again."
      );
    },
  });

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
      <h2 className="text-2xl font-bold">Create MX User</h2>
      <p className="text-muted-foreground">
        You need to create an MX User before connecting your banks
      </p>
      <Button
        onClick={() => createMxUserMutation.mutate()}
        disabled={createMxUserMutation.isPending}
      >
        {createMxUserMutation.isPending ? (
          <div className="flex items-center gap-2">
            <Loader size={20} isLoading={createMxUserMutation.isPending} />
            <span>Creating MX User...</span>
          </div>
        ) : (
          "Create MX User"
        )}
      </Button>
    </div>
  );
}
