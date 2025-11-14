"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

const formSchema = z.object({
  station_id: z.string().min(1, "Mã trạm là bắt buộc"),
  name: z.string().min(3, "Tên trạm phải có ít nhất 3 ký tự"),
  street: z.string().min(1, "Địa chỉ là bắt buộc"),
  ward: z.string().min(1, "Phường/Xã là bắt buộc"),
  district: z.string().min(1, "Quận/Huyện là bắt buộc"),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          station_id: initialData.station_id,
          name: initialData.name,
          street: initialData.address.street,
          ward: initialData.address.ward,
          district: initialData.address.district,
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
          ward: "",
          district: "",
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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const data = {
      station_id: values.station_id,
      name: values.name,
      address: {
        street: values.street,
        ward: values.ward,
        district: values.district,
        city: "TP.HCM",
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
                  <FormLabel>Địa chỉ *</FormLabel>
                  <FormControl>
                    <Input placeholder="Quốc lộ 13" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phường/Xã *</FormLabel>
                    <FormControl>
                      <Input placeholder="Phường 14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quận/Huyện *</FormLabel>
                    <FormControl>
                      <Input placeholder="Quận Bình Thạnh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
