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
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";

interface MxUser {
  _id: string;
  userId: string;
  mxGuid: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

const Users = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MX Users</h1>
        <p className="text-muted-foreground">
          A list of all users with MX accounts
        </p>
      </div>

      {/* <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>MX GUID</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mxUsers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No MX users found
                </TableCell>
              </TableRow>
            ) : (
              mxUsers?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {user.user.fullName}
                  </TableCell>
                  <TableCell>{user.user.email}</TableCell>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {user.mxGuid}
                    </code>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div> */}
    </div>
  );
};

export default Users;
