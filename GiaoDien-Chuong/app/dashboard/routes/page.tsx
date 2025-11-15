"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { RouteCard } from "@/components/routes/route-card";
import { api } from "@/lib/api";
import type { BusRoute } from "@/types";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutes();
  }, [statusFilter, typeFilter]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;

      const response = await api.getRoutes(params);
      if (response.success) {
        setRoutes(response.data);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tuyến",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!routeToDelete) return;

    try {
      const response = await api.deleteRoute(routeToDelete);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa tuyến",
        });
        fetchRoutes();
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa tuyến",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
    }
  };

  const openDeleteDialog = (routeId: string) => {
    setRouteToDelete(routeId);
    setDeleteDialogOpen(true);
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.route_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Tuyến</h2>
          <p className="text-muted-foreground">Quản lý các tuyến xe buýt</p>
        </div>
        <Link href="/dashboard/routes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tuyến mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tuyến..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại tuyến" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="normal">Thường</SelectItem>
            <SelectItem value="express">Nhanh</SelectItem>
            <SelectItem value="rapid">Express</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Routes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy tuyến nào</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.route_id}
              route={route}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tuyến này? Hành động này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
