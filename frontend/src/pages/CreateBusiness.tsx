import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessApi } from "@/api/client";
import { toast } from "@/components/ui/toast";

const businessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  gstin: z.string().optional(),
  address: z.string().optional(),
  business_type: z.string().optional(),
});

type BusinessForm = z.infer<typeof businessSchema>;

export default function CreateBusiness() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: BusinessForm) => {
    setIsLoading(true);
    try {
      const business = await businessApi.create(data);
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
      localStorage.setItem("selectedBusiness", business.id);
      toast({ title: "Business created successfully", variant: "success" });
      navigate("/");
    } catch (error) {
      console.error("Failed to create business:", error);
      toast({
        title: "Failed to create business",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Business</h1>
        <p className="text-muted-foreground">Add your first business to get started</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Enter your business information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                placeholder="Your Business Name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                placeholder="29AABCU9603R1ZM"
                {...register("gstin")}
              />
              <p className="text-xs text-muted-foreground">
                15-digit GST identification number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                placeholder="Regular / Composition / Other"
                {...register("business_type")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Business address"
                {...register("address")}
              />
            </div>
          </CardContent>
          <div className="flex gap-4 p-6 pt-0">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Business
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
