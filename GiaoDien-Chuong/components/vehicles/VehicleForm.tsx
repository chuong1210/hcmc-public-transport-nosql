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
import type { Vehicle } from "@/types";

const formSchema = z.object({
  vehicle_id: z.string().min(1, "Mã xe là bắt buộc"),
  license_plate: z.string().min(1, "Biển số xe là bắt buộc"),
  type: z.enum(["bus_16", "bus_40", "bus_60"]),
  capacity: z.number().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  year: z
    .number()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  fuel_type: z.enum(["diesel", "cng", "electric"]),
  condition: z.enum(["good", "fair", "maintenance"]),
  status: z.enum(["active", "inactive", "maintenance"]),
  last_maintenance: z.string(),
  next_maintenance: z.string(),
  air_conditioning: z.boolean(),
  wifi: z.boolean(),
  usb_charging: z.boolean(),
  wheelchair_lift: z.boolean(),
});

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function VehicleForm({
  initialData,
  onSubmit,
  isLoading,
}: VehicleFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          vehicle_id: initialData.vehicle_id,
          license_plate: initialData.license_plate,
          type: initialData.type,
          capacity: initialData.capacity,
          manufacturer: initialData.manufacturer,
          model: initialData.model,
          year: initialData.year,
          fuel_type: initialData.fuel_type,
          condition: initialData.condition,
          status: initialData.status,
          last_maintenance: initialData.last_maintenance?.split("T")[0] || "",
          next_maintenance: initialData.next_maintenance?.split("T")[0] || "",
          air_conditioning: initialData.features.air_conditioning,
          wifi: initialData.features.wifi,
          usb_charging: initialData.features.usb_charging,
          wheelchair_lift: initialData.features.wheelchair_lift,
        }
      : {
          vehicle_id: "",
          license_plate: "",
          type: "bus_40",
          capacity: 40,
          manufacturer: "",
          model: "",
          year: new Date().getFullYear(),
          fuel_type: "diesel",
          condition: "good",
          status: "active",
          last_maintenance: "",
          next_maintenance: "",
          air_conditioning: false,
          wifi: false,
          usb_charging: false,
          wheelchair_lift: false,
        },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const data = {
      vehicle_id: values.vehicle_id,
      license_plate: values.license_plate,
      type: values.type,
      capacity: values.capacity,
      manufacturer: values.manufacturer,
      model: values.model,
      year: values.year,
      fuel_type: values.fuel_type,
      condition: values.condition,
      status: values.status,
      last_maintenance: values.last_maintenance
        ? new Date(values.last_maintenance).toISOString()
        : new Date().toISOString(),
      next_maintenance: values.next_maintenance
        ? new Date(values.next_maintenance).toISOString()
        : new Date().toISOString(),
      features: {
        air_conditioning: values.air_conditioning,
        wifi: values.wifi,
        usb_charging: values.usb_charging,
        wheelchair_lift: values.wheelchair_lift,
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
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã xe *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="V001"
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
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biển số xe *</FormLabel>
                    <FormControl>
                      <Input placeholder="51A-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hãng sản xuất *</FormLabel>
                    <FormControl>
                      <Input placeholder="Hyundai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mẫu xe *</FormLabel>
                    <FormControl>
                      <Input placeholder="Universe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm sản xuất *</FormLabel>
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

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Thông số kỹ thuật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại xe *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bus_16">16 chỗ</SelectItem>
                        <SelectItem value="bus_40">40 chỗ</SelectItem>
                        <SelectItem value="bus_60">60 chỗ</SelectItem>
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
                    <FormLabel>Sức chứa *</FormLabel>
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

              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại nhiên liệu *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diesel">Dầu diesel</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                        <SelectItem value="electric">Điện</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tình trạng *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="good">Tốt</SelectItem>
                        <SelectItem value="fair">Trung bình</SelectItem>
                        <SelectItem value="maintenance">Cần bảo trì</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                      <SelectItem value="maintenance">Đang bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Bảo trì</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="last_maintenance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bảo trì lần cuối</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_maintenance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bảo trì tiếp theo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Tiện nghi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="air_conditioning"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Điều hòa</FormLabel>
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
                name="usb_charging"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sạc USB</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wheelchair_lift"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Thang máy xe lăn</FormLabel>
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
            {isLoading ? "Đang lưu..." : "Lưu xe"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
