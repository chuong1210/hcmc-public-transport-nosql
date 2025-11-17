"use client";

import { useRouter } from "next/navigation";
import { RouteForm } from "@/components/routes/route-form";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewRoutePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      const response = await api.createRoute(data);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo tuyến mới",
        });
        router.push("/dashboard/routes");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tạo tuyến",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/routes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thêm tuyến mới</h2>
          <p className="text-muted-foreground">
            Nhập thông tin để tạo tuyến xe buýt mới
          </p>
        </div>
      </div>

      <RouteForm onSubmit={handleSubmit} />
    </div>
  );
}
