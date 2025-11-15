"use client";

import { useRouter } from "next/navigation";
import { StationForm } from "@/components/stations/station-form";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewStationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      const response = await api.createStation(data);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo trạm mới",
        });
        router.push("/dashboard/stations");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tạo trạm",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thêm trạm mới</h2>
          <p className="text-muted-foreground">
            Nhập thông tin để tạo trạm xe buýt mới
          </p>
        </div>
      </div>

      <StationForm onSubmit={handleSubmit} />
    </div>
  );
}
