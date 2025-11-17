"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types";

export default function EditVehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicle();
  }, [params.id]);

  const fetchVehicle = async () => {
    try {
      const response = await api.getVehicle(params.id);
      if (response.success) {
        setVehicle(response.data.vehicle);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin xe",
        variant: "destructive",
      });
      router.push("/dashboard/vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await api.updateVehicle(params.id, data);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin xe",
        });
        router.push("/dashboard/vehicles");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể cập nhật xe",
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

  if (!vehicle) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa xe</h2>
          <p className="text-muted-foreground">
            Cập nhật thông tin xe {vehicle.license_plate}
          </p>
        </div>
      </div>

      <VehicleForm initialData={vehicle} onSubmit={handleSubmit} />
    </div>
  );
}
