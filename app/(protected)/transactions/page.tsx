"use client";
import dayjs from "dayjs";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { addDays, isWithinInterval } from "date-fns";
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

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  SearchIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

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

    totals: {
      income: number;
      expenses: number;
      netChange: number;
    };

    timeRangeExpenses: {
      breakdown: { category: string; amount: number; percentage: number }[];
      total: number;
    } | null;
  };
}

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | null>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    setSearchTerm("");
    setSelectedCategory(null);
    setDateRange({
      from: undefined,
      to: undefined,
    });
  }, [currentPage]);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, timeRange],
    queryFn: async () => {
      const response = await axiosInstance.get("/bank/transactions", {
        params: {
          currentPage,
          perPage: 25,
          days: timeRange,
        },
      });
      return response.data as TransactionResponse;
    },
  });

  const transactions = data?.data.transactions;
  const pagination = data?.data.pagination;
  const timeRangeData = data?.data.timeRangeExpenses;

  const categories = useMemo(() => {
    return [
      ...new Set(transactions?.map((t) => t.topLevelCategory) || []),
    ].sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    if (
      searchTerm === "" &&
      !selectedCategory &&
      !dateRange!.from &&
      !dateRange!.to
    ) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const matchesSearch =
        searchTerm === "" ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCategory =
        !selectedCategory || transaction.topLevelCategory === selectedCategory;

      const transactionDate = new Date(transaction.date);
      const matchesDateRange =
        !dateRange!.from ||
        !dateRange!.to ||
        isWithinInterval(transactionDate, {
          start: dateRange!.from,
          end: dateRange!.to,
        });

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [transactions, searchTerm, selectedCategory, dateRange]);

  const getTimeRangeDate = (days: string) => {
    if (days === "all") return undefined;
    return addDays(new Date(), -parseInt(days));
  };

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

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#A4DE6C",
    "#D0ED57",
  ];

  const totalExpenses = useMemo(() => {
    return timeRangeData?.total ?? 0;
  }, [timeRangeData?.total]);

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
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 h-[300px]">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Expenses Breakdown
                  </CardTitle>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription className="text-2xl font-bold">
                  {formatAmount(totalExpenses, "USD")}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {timeRange === "all"
                      ? "all time"
                      : `last ${timeRange} days`}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[220px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeRangeData?.breakdown ?? []}
                      cx="45%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {timeRangeData?.breakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatAmount(value, "USD")}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "6px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{
                        paddingLeft: "15px",
                        maxHeight: "180px",
                        width: "50%",
                        overflow: "auto",
                      }}
                      iconSize={8}
                      iconType="circle"
                      formatter={(value, entry) => {
                        const category = timeRangeData?.breakdown.find(
                          (cat) => cat.category === value
                        );
                        if (!category) return value;
                        return (
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-sm truncate flex-1">
                              {value}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-sm">
                              {category.percentage}%
                            </span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-4 h-[300px]">
              <Card className="h-[145px]">
                <CardHeader className="h-full flex flex-col justify-center p-4">
                  <div className="space-y-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Income
                    </CardTitle>
                    <div className="flex items-center">
                      <ArrowDownIcon className="h-4 w-4 text-green-500 mr-2" />
                      <CardDescription className="text-2xl font-bold text-green-600">
                        {formatAmount(data?.data.totals.income ?? 0, "USD")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              <Card className="h-[145px]">
                <CardHeader className="h-full flex flex-col justify-center p-4">
                  <div className="space-y-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Net Change
                    </CardTitle>
                    <div className="flex items-center">
                      {(data?.data.totals.netChange ?? 0) > 0 ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <CardDescription
                        className={`text-2xl font-bold ${
                          (data?.data.totals.netChange ?? 0) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmount(data?.data.totals.netChange ?? 0, "USD")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                      Showing {filteredTransactions?.length} of{" "}
                      {transactions?.length} transactions
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
                    date={
                      dateRange || {
                        from: undefined,
                        to: undefined,
                      }
                    }
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
                  {filteredTransactions?.map((transaction) => (
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
                  {filteredTransactions?.length === 0 && (
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

                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={() => setCurrentPage(1)}
                        isActive={currentPage === 1}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

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

                    {currentPage < (pagination?.totalPages || 1) - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
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
