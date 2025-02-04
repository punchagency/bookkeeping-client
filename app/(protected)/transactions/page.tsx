"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, isWithinInterval } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  SearchIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "react-day-picker";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Transaction {
  category: string;
  date: string;
  status: string;
  topLevelCategory: string;
  type: string;
  accountId: string;
  userId: string;
  accountGuid: string;
  amount: number;
  currencyCode: string;
  description: string;
  guid: string;
  transactionId: string;
  isExpense: boolean;
  isIncome: boolean;
  memo: string | null;
  originalDescription: string;
  memberGuid: string;
  userGuid: string;
  metadata: {
    merchantCategoryCode: string | null;
    merchantGuid: string | null;
    classification: string | null;
    extendedTransactionType: string | null;
  };
  isDeleted: boolean;
}

interface TransactionResponse {
  code: number;
  status: string;
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      currentPage: number;
      perPage: number;
      totalEntries: number;
      totalPages: number;
    };
  };
}

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", currentPage],
    queryFn: async () => {
      const response = await axiosInstance.get("/bank/transactions", {
        params: {
          currentPage,
          perPage: 25,
        },
      });
      return response.data as TransactionResponse;
    },
  });

  const transactions = data?.data.transactions;
  const pagination = data?.data.pagination;

  const categories = useMemo(() => {
    return [
      ...new Set(transactions?.map((t) => t.topLevelCategory) || []),
    ].sort();
  }, [transactions]);

  const totals = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, net: 0 };

    return transactions.reduce(
      (acc, t) => {
        if (t.isIncome) acc.income += t.amount;
        if (t.isExpense) acc.expenses += t.amount;
        acc.net += t.isIncome ? t.amount : -t.amount;
        return acc;
      },
      { income: 0, expenses: 0, net: 0 }
    );
  }, [transactions]);

  const getTransactionIcon = (
    type: string,
    isExpense: boolean,
    isIncome: boolean
  ) => {
    if (isIncome) return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
    if (isExpense) return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
    return <ArrowRightIcon className="h-4 w-4 text-yellow-500" />;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Income: "bg-green-500/15 text-green-700",
      Transfer: "bg-yellow-500/15 text-yellow-700",
      "Food & Dining": "bg-orange-500/15 text-orange-700",
      Shopping: "bg-blue-500/15 text-blue-700",
      Entertainment: "bg-purple-500/15 text-purple-700",
      "Health & Fitness": "bg-pink-500/15 text-pink-700",
      "Fees & Charges": "bg-red-500/15 text-red-700",
      Home: "bg-indigo-500/15 text-indigo-700",
      "Personal Care": "bg-teal-500/15 text-teal-700",
    };
    return colors[category] || "bg-gray-500/15 text-gray-700";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of all your transactions
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader size={30} isLoading={true} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-green-600">
                  {formatAmount(totals.income, "USD")}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-red-600">
                  {formatAmount(totals.expenses, "USD")}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Change
                </CardTitle>
                <CardDescription
                  className={`text-2xl font-bold ${
                    totals.net > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatAmount(totals.net, "USD")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                      Showing {transactions?.length} of {transactions?.length}{" "}
                      transactions
                    </CardDescription>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(value) =>
                      setSelectedCategory(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow
                      key={transaction.guid}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(
                            transaction.type,
                            transaction.isExpense,
                            transaction.isIncome
                          )}
                          {dayjs(transaction.date).format("MMM D, YYYY")}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge
                          className={getCategoryColor(
                            transaction.topLevelCategory
                          )}
                        >
                          {transaction.topLevelCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.isIncome
                              ? "text-green-600"
                              : transaction.isExpense
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {formatAmount(
                            transaction.amount,
                            transaction.currencyCode
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>

                    {/* First page */}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={() => setCurrentPage(1)}
                        isActive={currentPage === 1}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* Show ellipsis if needed */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Current page and surrounding pages */}
                    {Array.from({ length: 3 }, (_, i) => currentPage + i - 1)
                      .filter(
                        (page) =>
                          page > 1 && page < (pagination?.totalPages || 1)
                      )
                      .map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {/* Show ellipsis if needed */}
                    {currentPage < (pagination?.totalPages || 1) - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    {/* Last page */}
                    {pagination?.totalPages && pagination.totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          isActive={currentPage === pagination?.totalPages}
                        >
                          {pagination?.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(p + 1, pagination?.totalPages || 1)
                          )
                        }
                        aria-disabled={currentPage === pagination?.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground text-center mt-2">
                  Showing page {pagination?.currentPage} of{" "}
                  {pagination?.totalPages} ({pagination?.totalEntries} total
                  entries)
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Transactions;
