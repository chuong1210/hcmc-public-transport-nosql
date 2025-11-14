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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusRoute } from "@/types";

const formSchema = z.object({
  route_id: z.string().min(1, "Mã tuyến là bắt buộc"),
  route_name: z.string().min(3, "Tên tuyến phải có ít nhất 3 ký tự"),
  route_code: z.string().min(1, "Số hiệu tuyến là bắt buộc"),
  type: z.enum(["normal", "express", "rapid"]),
  direction: z.enum(["one-way", "two-way"]),
  start_time: z.string(),
  end_time: z.string(),
  frequency: z.number().min(1, "Tần suất phải lớn hơn 0"),
  adult_fare: z.number().min(0),
  student_fare: z.number().min(0),
  senior_fare: z.number().min(0),
  total_distance: z.number().min(0),
  estimated_duration: z.number().min(0),
  status: z.enum(["active", "inactive"]),
  operator: z.string(),
  description: z.string().optional(),
});

interface RouteFormProps {
  initialData?: BusRoute;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function RouteForm({
  initialData,
  onSubmit,
  isLoading,
}: RouteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          route_id: initialData.route_id,
          route_name: initialData.route_name,
          route_code: initialData.route_code,
          type: initialData.type,
          direction: initialData.direction,
          start_time: initialData.operating_hours.start,
          end_time: initialData.operating_hours.end,
          frequency: initialData.frequency,
          adult_fare: initialData.fare.adult,
          student_fare: initialData.fare.student,
          senior_fare: initialData.fare.senior,
          total_distance: initialData.total_distance,
          estimated_duration: initialData.estimated_duration,
          status: initialData.status,
          operator: initialData.operator,
          description: initialData.description,
        }
      : {
          route_id: "",
          route_name: "",
          route_code: "",
          type: "normal",
          direction: "two-way",
          start_time: "05:00",
          end_time: "23:00",
          frequency: 15,
          adult_fare: 7000,
          student_fare: 3500,
          senior_fare: 3500,
          total_distance: 0,
          estimated_duration: 0,
          status: "active",
          operator: "SAMCO",
          description: "",
        },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const data = {
      route_id: values.route_id,
      route_name: values.route_name,
      route_code: values.route_code,
      type: values.type,
      direction: values.direction,
      operating_hours: {
        start: values.start_time,
        end: values.end_time,
      },
      frequency: values.frequency,
      fare: {
        adult: values.adult_fare,
        student: values.student_fare,
        senior: values.senior_fare,
        currency: "VND",
      },
      total_distance: values.total_distance,
      estimated_duration: values.estimated_duration,
      status: values.status,
      operator: values.operator,
      description: values.description,
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
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="route_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã tuyến *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R001"
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
                name="route_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số hiệu *</FormLabel>
                    <FormControl>
                      <Input placeholder="01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhà vận hành *</FormLabel>
                    <FormControl>
                      <Input placeholder="SAMCO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="route_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tuyến *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bến Xe Miền Đông - Bến Thành"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả về tuyến xe buýt..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Route Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Thuộc tính tuyến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại tuyến *</FormLabel>
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
                        <SelectItem value="normal">Thường</SelectItem>
                        <SelectItem value="express">Nhanh</SelectItem>
                        <SelectItem value="rapid">Express</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hướng đi *</FormLabel>
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
                        <SelectItem value="one-way">Một chiều</SelectItem>
                        <SelectItem value="two-way">Hai chiều</SelectItem>
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">
                          Ngừng hoạt động
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ kết thúc *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tần suất (phút) *</FormLabel>
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
                name="estimated_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian (phút) *</FormLabel>
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

            <FormField
              control={form.control}
              name="total_distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tổng khoảng cách (km) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
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
          </CardContent>
        </Card>

        {/* Fare Information */}
        <Card>
          <CardHeader>
            <CardTitle>Giá vé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="adult_fare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người lớn (VNĐ) *</FormLabel>
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
                name="student_fare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinh viên (VNĐ) *</FormLabel>
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
                name="senior_fare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người cao tuổi (VNĐ) *</FormLabel>
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu tuyến"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
