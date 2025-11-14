"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StationForm } from "@/components/stations/station-form";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Station } from "@/types";

export default function EditStationPage({
  params,
}: {
  params: { id: string };
}) {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchStation();
  }, [params.id]);

  const fetchStation = async () => {
    try {
      const response = await api.getStation(params.id);
      if (response.success) {
        setStation(response.data);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin trạm",
        variant: "destructive",
      });
      router.push("/dashboard/stations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await api.updateStation(params.id, data);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin trạm",
        });
        router.push("/dashboard/stations");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể cập nhật trạm",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (!station) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa trạm</h2>
          <p className="text-muted-foreground">
            Cập nhật thông tin trạm {station.name}
          </p>
        </div>
      </div>

      <StationForm initialData={station} onSubmit={handleSubmit} />
    </div>
  );
}
