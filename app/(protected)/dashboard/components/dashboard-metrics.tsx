"use client";
import { CreditCard, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

const metrics = [
  {
    title: "Total Balance",
    value: "₦0.00",
    change: "+12.5%",
    isPositive: true,
    icon: Wallet,
  },
  {
    title: "Total Income",
    value: "₦0.00",
    change: "+8.2%",
    isPositive: true,
    icon: ArrowUpRight,
  },
  {
    title: "Total Expenses",
    value: "₦0.00",
    change: "-3.1%",
    isPositive: false,
    icon: ArrowDownRight,
  },
  {
    title: "Connected Banks",
    value: "0",
    change: "Banks",
    isPositive: true,
    icon: CreditCard,
  },
];

export const DashboardMetrics = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="rounded-xl border bg-card text-card-foreground shadow"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <metric.icon className="h-5 w-5 text-muted-foreground" />
              <span
                className={`text-sm ${
                  metric.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {metric.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
