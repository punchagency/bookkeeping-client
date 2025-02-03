/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { axiosInstance } from "@/app/config/axios";
import { Loader } from "@/components/loader";
import dayjs from "dayjs";

interface MxUser {
  id: string;
  mxUserId: string;
  memberId?: string;
  email: string;
  isDisabled: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

const Users = () => {
  const { data: mxUsers, isLoading } = useQuery({
    queryKey: ["mx-users"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mx-user");
      return response.data.data.mxUsers;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MX Users</h1>
        <p className="text-muted-foreground">
          A list of all users with MX accounts
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MX GUID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mxUsers &&
              mxUsers?.map((user: MxUser) => (
                <TableRow key={user.id}>
                  <TableCell>{user.mxUserId}</TableCell>
                  <TableCell>
                    {dayjs(user.createdAt).format("MMM D, YYYY h:mm A")}
                  </TableCell>
                  <TableCell>{user.memberId}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))}
            {mxUsers?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No MX users found. Try connecting a bank account first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Users;
