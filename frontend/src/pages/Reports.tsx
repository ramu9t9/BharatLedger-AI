import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart3, Download, Loader2, FileJson } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { gstApi, reportApi, businessApi } from "@/api/client";
import { formatCurrency, downloadJson } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const selectedBusiness = localStorage.getItem("selectedBusiness");

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAll,
  });

  const { data: liability, isLoading: liabilityLoading } = useQuery({
    queryKey: ["gst-liability", selectedBusiness],
    queryFn: () => selectedBusiness ? gstApi.getLiability(selectedBusiness) : null,
    enabled: !!selectedBusiness,
    retry: false,
  });

  const { data: expenseReport, isLoading: expensesLoading } = useQuery({
    queryKey: ["expense-report", selectedBusiness],
    queryFn: () => selectedBusiness ? reportApi.getExpenses({ business_id: selectedBusiness }) : [],
    enabled: !!selectedBusiness,
    retry: false,
  });

  const { data: plReport, isLoading: plLoading } = useQuery({
    queryKey: ["pl-report", selectedBusiness],
    queryFn: () => selectedBusiness ? reportApi.getPL({ business_id: selectedBusiness }) : null,
    enabled: !!selectedBusiness,
    retry: false,
  });

  const gstr1Mutation = useMutation({
    mutationFn: () => selectedBusiness ? gstApi.prepareGSTR1(selectedBusiness) : Promise.reject("No business"),
    onSuccess: (data) => {
      downloadJson(data, `gstr1-${new Date().toISOString().split("T")[0]}.json`);
      toast({ title: "GSTR-1 downloaded", variant: "success" });
    },
  });

  const gstr3bMutation = useMutation({
    mutationFn: () => selectedBusiness ? gstApi.prepareGSTR3B(selectedBusiness) : Promise.reject("No business"),
    onSuccess: (data) => {
      downloadJson(data, `gstr3b-${new Date().toISOString().split("T")[0]}.json`);
      toast({ title: "GSTR-3B downloaded", variant: "success" });
    },
  });

  if (!selectedBusiness || !businesses || businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No business selected</h3>
        <p className="text-sm text-muted-foreground">Select a business from the sidebar to view reports</p>
      </div>
    );
  }

  const expenseData = (Array.isArray(expenseReport) ? expenseReport : [])
    .map((item) => ({
      name: String(item?.category ?? "Unknown"),
      value: Number(item?.total ?? 0),
      gst: Number(item?.gst_total ?? 0),
    }))
    .filter((d) => d.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Financial summaries and GST returns</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gst">GST Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* P&L Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Summary</CardTitle>
              <CardDescription>Income vs Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {plLoading ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : plReport ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(plReport?.total_income ?? 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(plReport?.total_expenses ?? 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(plReport?.net_profit ?? 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <Skeleton className="h-64" />
                ) : expenseData.length > 0 ? (
                  <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No expense data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GST by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <Skeleton className="h-64" />
                ) : expenseData.length > 0 ? (
                  <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="gst"
                      >
                        {expenseData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No GST data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          {/* GST Liability */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Output Tax"
              value={formatCurrency(liability?.output_tax || 0)}
              description="Total GST collected"
            />
            <StatCard
              title="Input Tax Credit"
              value={formatCurrency(liability?.itc || 0)}
              description="GST available as credit"
            />
            <StatCard
              title="Tax Payable"
              value={formatCurrency(liability?.tax_payable || 0)}
              description="Net GST to be paid"
            />
          </div>

          {/* GSTR Generation */}
          <Card>
            <CardHeader>
              <CardTitle>GST Returns</CardTitle>
              <CardDescription>Generate and download GST return files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">GSTR-1 (Outward Supplies)</p>
                  <p className="text-sm text-muted-foreground">
                    Details of all outward supplies
                  </p>
                </div>
                <Button
                  onClick={() => gstr1Mutation.mutate()}
                  disabled={gstr1Mutation.isPending}
                >
                  {gstr1Mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download JSON
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">GSTR-3B (Summary Return)</p>
                  <p className="text-sm text-muted-foreground">
                    Summary of tax liability
                  </p>
                </div>
                <Button
                  onClick={() => gstr3bMutation.mutate()}
                  disabled={gstr3bMutation.isPending}
                >
                  {gstr3bMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
