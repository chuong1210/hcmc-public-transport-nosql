"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Station } from "@/types";
import { useEffect, useState } from "react";
import { useAddressData } from "@/hooks/use-address-data";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  station_id: z.string().min(1, "Mã trạm là bắt buộc"),
  name: z.string().min(3, "Tên trạm phải có ít nhất 3 ký tự"),
  street: z.string().min(1, "Địa chỉ là bắt buộc"),
  ward_code: z.string().min(1, "Phường/Xã là bắt buộc"),
  province_code: z.string().min(1, "Tỉnh/Thành phố là bắt buộc"),
  latitude: z.number().min(-90).max(90, "Latitude không hợp lệ"),
  longitude: z.number().min(-180).max(180, "Longitude không hợp lệ"),
  type: z.enum(["terminal", "intermediate", "stop"]),
  status: z.enum(["active", "maintenance", "inactive"]),
  capacity: z.number().min(1, "Sức chứa phải lớn hơn 0"),
  waiting_area: z.boolean(),
  wifi: z.boolean(),
  toilet: z.boolean(),
  atm: z.boolean(),
  wheelchair_accessible: z.boolean(),
});

interface StationFormProps {
  initialData?: Station;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function StationForm({
  initialData,
  onSubmit,
  isLoading,
}: StationFormProps) {
  const { provinces, wards, loading, loadProvinces, loadWards, loadHCMC } =
    useAddressData();

  const [selectedProvince, setSelectedProvince] = useState<string>("79"); // Default: TP.HCM

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          station_id: initialData.station_id,
          name: initialData.name,
          street: initialData.address.street,
          ward_code: "",
          province_code: "79",
          latitude: initialData.location.latitude,
          longitude: initialData.location.longitude,
          type: initialData.type,
          status: initialData.status,
          capacity: initialData.capacity,
          waiting_area: initialData.facilities.waiting_area,
          wifi: initialData.facilities.wifi,
          toilet: initialData.facilities.toilet,
          atm: initialData.facilities.atm,
          wheelchair_accessible: initialData.facilities.wheelchair_accessible,
        }
      : {
          station_id: "",
          name: "",
          street: "",
          ward_code: "",
          province_code: "79",
          latitude: 10.7769,
          longitude: 106.7009,
          type: "intermediate",
          status: "active",
          capacity: 10,
          waiting_area: false,
          wifi: false,
          toilet: false,
          atm: false,
          wheelchair_accessible: false,
        },
  });

  useEffect(() => {
    loadProvinces();
    loadHCMC(); // Load TP.HCM wards by default
  }, []);

  const handleProvinceChange = async (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    form.setValue("ward_code", "");
    await loadWards(parseInt(provinceCode));
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Find names from codes
    const province = provinces.find(
      (p) => p.code === parseInt(values.province_code)
    );
    const ward = wards.find((w) => w.code === parseInt(values.ward_code));

    const data = {
      station_id: values.station_id,
      name: values.name,
      address: {
        street: values.street,
        ward: ward?.name || "",
        city: province?.name || "TP.HCM",
      },
      location: {
        latitude: values.latitude,
        longitude: values.longitude,
      },
      type: values.type,
      status: values.status,
      capacity: values.capacity,
      facilities: {
        waiting_area: values.waiting_area,
        wifi: values.wifi,
        toilet: values.toilet,
        atm: values.atm,
        wheelchair_accessible: values.wheelchair_accessible,
      },
    };

    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="station_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã trạm *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ST001"
                        {...field}
                        disabled={!!initialData}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên trạm *</FormLabel>
                    <FormControl>
                      <Input placeholder="Bến Xe Miền Đông" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số nhà, đường *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Đường ABC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CHỈ CÒN 2 DROPDOWN: TỈNH/TP VÀ PHƯỜNG/XÃ */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="province_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tỉnh/Thành phố *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProvinceChange(value);
                      }}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Chọn tỉnh/thành phố" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.code}
                            value={province.code.toString()}
                          >
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ward_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phường/Xã *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loading || wards.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Chọn phường/xã" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {wards.map((ward) => (
                          <SelectItem
                            key={ward.code}
                            value={ward.code.toString()}
                          >
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {wards.length > 0 && (
              <p className="text-xs text-muted-foreground">
                * Sau sát nhập tháng 9/2025, các phường/xã thuộc trực tiếp
                tỉnh/thành phố
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Tọa độ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="10.7769"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="106.7009"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Thuộc tính</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại trạm *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại trạm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="terminal">Đầu cuối</SelectItem>
                        <SelectItem value="intermediate">Trung gian</SelectItem>
                        <SelectItem value="stop">Điểm dừng</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                        <SelectItem value="inactive">
                          Ngừng hoạt động
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sức chứa (xe) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>Tiện ích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="waiting_area"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Khu vực chờ</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wifi"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>WiFi</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toilet"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Nhà vệ sinh</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="atm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>ATM</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wheelchair_accessible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hỗ trợ xe lăn</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu trạm"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
