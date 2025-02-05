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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

interface Statement {
  guid: string;
  member_guid: string;
  user_guid: string;
  uri: string;
  account_guid: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

interface StatementData {
  code: number;
  status: string;
  success: boolean;
  message: string;
  data: {
    statements: Statement[];
    pagination: {
      current_page: number;
      per_page: number;
      total_entries: number;
      total_pages: number;
    };
  };
}

const Statements = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["statements"],
    queryFn: async () => {
      const response = await axiosInstance.post("/mx-user/statements");
      return response.data as StatementData;
    },
  });

  const allStatements = data?.data.statements || [];

  if (!isMounted) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statements</h1>
          <p className="text-muted-foreground">
            Here&apos;s a list of all your account statements
          </p>
        </div>
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statements</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of all your account statements
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Account Statements</CardTitle>
            <CardDescription>
              {allStatements.length
                ? `You have ${allStatements.length} statements available`
                : "No statements available for your accounts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allStatements.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Created Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allStatements.map((statement) => (
                    <TableRow
                      key={statement.guid}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {dayjs(statement.created_at).format("MMMM YYYY")}
                      </TableCell>
                      <TableCell>{statement.account_guid}</TableCell>
                      <TableCell>
                        {dayjs(statement.updated_at).format("MMM D, YYYY")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-muted"
                          onClick={() => window.open(statement.uri, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No Statements Available
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  There are currently no statements available for your accounts.
                  New statements will appear here automatically when they become
                  available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Statements;
