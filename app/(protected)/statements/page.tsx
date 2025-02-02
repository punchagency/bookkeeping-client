"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

const Statements = () => {
  const pathname = usePathname();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statements</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of all your statements
        </p>
      </div>
    </div>
  );
};

export default Statements;
