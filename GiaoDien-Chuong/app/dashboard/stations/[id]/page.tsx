"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StationForm } from "@/components/stations/station-form";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Station } from "@/types";

export default function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Thêm state saving
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchStation();
  }, [id]);

  const fetchStation = async () => {
    try {
      const response = await api.getStation(id);
      if (response.success) {
        // Đảm bảo dữ liệu trả về là object Station
        const stationData = response.data.station || response.data;
        setStation(stationData);
      }
    } catch (error) {
      console.error("Fetch station error:", error);
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
    setIsSaving(true);
    try {
      const response = await api.updateStation(id, data);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/stations");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Không tìm thấy trạm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stations">
          <Button variant="ghost" size="icon" className="hover:bg-sky-50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div>
          <h2 className="text-3xl font-bold gradient-text-ocean">
            Chỉnh sửa trạm
          </h2>
          <p className="text-muted-foreground">
            Cập nhật thông tin trạm: <span className="font-semibold text-sky-700">{station.name}</span>
          </p>
        </div>
      </div>

      <StationForm
        initialData={station}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        onCancel={handleCancel}
      />
    </div>
  );
}