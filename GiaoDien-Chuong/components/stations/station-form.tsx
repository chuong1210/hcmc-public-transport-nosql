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
// import { useAddressData } from "@/hooks/use-address-data"; // XÓA HOOK NÀY
import { provincesAPI } from "@/lib/provinces"; // Import trực tiếp API
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AddressAutocomplete } from "./address-autocomplete";
import { Label } from "../ui/label";

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
  onCancel?: () => void;
}

export function StationForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
}: StationFormProps) {
  // --- STATE QUẢN LÝ DỮ LIỆU ĐỊA CHÍNH ---
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true); // Loading tổng khi vào trang
  const [isWardLoading, setIsWardLoading] = useState(false); // Loading riêng khi chọn tỉnh
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      station_id: initialData?.station_id || "",
      name: initialData?.name || "",
      street: initialData?.address?.street || "",
      ward_code: "", // Sẽ set sau khi load xong API
      province_code: "", // Sẽ set sau khi load xong API
      latitude: initialData?.location?.latitude || 0,
      longitude: initialData?.location?.longitude || 0,
      type: initialData?.type || "intermediate",
      status: initialData?.status || "active",
      capacity: initialData?.capacity || 10,
      waiting_area: initialData?.facilities?.waiting_area || false,
      wifi: initialData?.facilities?.wifi || false,
      toilet: initialData?.facilities?.toilet || false,
      atm: initialData?.facilities?.atm || false,
      wheelchair_accessible: initialData?.facilities?.wheelchair_accessible || false,
    },
  });

  // --- 1. LOGIC KHỞI TẠO DỮ LIỆU (Chạy 1 lần duy nhất) ---
  useEffect(() => {
    const initForm = async () => {
      setIsDataLoading(true);
      try {
        // B1: Load danh sách tỉnh
        const listProvinces = await provincesAPI.getProvinces();
        setProvinces(listProvinces);

        let pCode = 79; // Mặc định HCM (code 79)

        // B2: Xác định mã tỉnh từ dữ liệu cũ (nếu có)
        if (initialData?.address?.city) {
          const cityName = initialData.address.city;
          const foundP = listProvinces.find((p: any) =>
            p.name === cityName ||
            p.name.toLowerCase().includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(p.name.toLowerCase())
          );
          if (foundP) pCode = foundP.code;
        }

        // Set giá trị tỉnh vào form
        form.setValue("province_code", pCode.toString());

        // B3: Load danh sách phường dựa trên mã tỉnh vừa tìm được
        const listWards = await provincesAPI.getAllWardsInProvince(pCode);
        setWards(listWards);

        // B4: Xác định mã phường
        if (initialData?.address?.ward && listWards.length > 0) {
          const wardName = initialData.address.ward;
          const foundW = listWards.find((w: any) => w.name === wardName);

          if (foundW) {
            form.setValue("ward_code", foundW.code.toString());
          } else {
            // Fallback: Lấy phường đầu tiên nếu tên cũ không khớp (do sáp nhập/đổi tên)
            const firstWard = listWards[0];
            console.warn(`Không tìm thấy phường "${wardName}". Tự động chọn "${firstWard.name}"`);
            form.setValue("ward_code", firstWard.code.toString());

            if (initialData) { // Chỉ hiện thông báo khi đang edit
              toast({
                title: "Lưu ý địa chỉ",
                description: `Phường "${wardName}" không có trong danh sách mới. Đã chọn mặc định "${firstWard.name}".`,
              });
            }
          }
        }

      } catch (error) {
        console.error("Lỗi khởi tạo form:", error);
        toast({ title: "Lỗi hệ thống", description: "Không tải được dữ liệu hành chính.", variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };

    initForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount


  // --- 2. XỬ LÝ KHI NGƯỜI DÙNG ĐỔI TỈNH ---
  const onProvinceChange = async (value: string) => {
    form.setValue("province_code", value);
    form.setValue("ward_code", ""); // Reset ô phường

    setIsWardLoading(true);
    setWards([]); // Xóa danh sách cũ để tránh chọn nhầm

    try {
      const newWards = await provincesAPI.getAllWardsInProvince(parseInt(value));
      setWards(newWards);
    } catch (error) {
      console.error("Lỗi load phường:", error);
      toast({ title: "Lỗi", description: "Không tải được danh sách phường", variant: "destructive" });
    } finally {
      setIsWardLoading(false);
    }
  };


  // --- 3. XỬ LÝ AUTOCOMPLETE (Chọn từ gợi ý) ---
  const handleAutocompleteSelect = async (data: {
    street: string;
    ward: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    // Tìm mã tỉnh mới
    const foundProvince = provinces.find(p =>
      p.name.toLowerCase().includes(data.city.toLowerCase()) ||
      data.city.toLowerCase().includes(p.name.toLowerCase())
    );
    const pCode = foundProvince ? foundProvince.code : 79;

    // Cập nhật form
    form.setValue("province_code", pCode.toString());
    form.setValue("street", data.street);
    form.setValue("latitude", data.lat);
    form.setValue("longitude", data.lng);

    // Load lại phường và tìm tên phường tương ứng
    setIsWardLoading(true);
    try {
      const newWards = await provincesAPI.getAllWardsInProvince(pCode);
      setWards(newWards);

      // Tìm phường (so sánh tương đối)
      const foundWard = newWards.find((w: any) =>
        w.name.toLowerCase().includes(data.ward.toLowerCase()) ||
        data.ward.toLowerCase().includes(w.name.toLowerCase())
      );

      if (foundWard) {
        form.setValue("ward_code", foundWard.code.toString());
      } else if (newWards.length > 0) {
        // Fallback
        form.setValue("ward_code", newWards[0].code.toString());
        toast({
          title: "Kiểm tra Phường/Xã",
          description: `Không tìm thấy phường "${data.ward}". Vui lòng chọn lại thủ công.`,
        });
      }
    } finally {
      setIsWardLoading(false);
    }
  };


  // --- 4. TÍNH NĂNG AUTO GEOCODE (Lấy tọa độ thủ công) ---
  const handleAutoGeocode = async () => {
    const street = form.getValues("street");
    const wardCode = form.getValues("ward_code");
    const provinceCode = form.getValues("province_code");

    if (!street) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa chỉ cụ thể.",
        variant: "destructive",
      });
      return;
    }

    const province = provinces.find((p) => p.code === parseInt(provinceCode));
    const ward = wards?.find((w) => w.code === parseInt(wardCode));

    setIsGeocoding(true);
    try {
      const fullAddress = `${street}, ${ward ? ward.name + ", " : ""}${province?.name || ""}`;
      console.log("🚀 Đang tìm tọa độ cho:", fullAddress);

      const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
      const encodedAddress = encodeURIComponent(fullAddress);

      // Bước 1: Search API
      const searchUrl = `https://maps.vietmap.vn/api/search/v3?apikey=${apiKey}&text=${encodedAddress}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!Array.isArray(searchData) || searchData.length === 0) {
        toast({ title: "Không tìm thấy", description: "Vui lòng kiểm tra lại địa chỉ.", variant: "destructive" });
        return;
      }

      const firstResult = searchData[0];
      let lat = firstResult.lat;
      let lng = firstResult.lng;

      // Bước 2: Place Detail API nếu Search chưa có lat/lng
      if (!lat || !lng) {
        if (firstResult.ref_id) {
          const placeUrl = `https://maps.vietmap.vn/api/place/v3?apikey=${apiKey}&refid=${firstResult.ref_id}`;
          const placeRes = await fetch(placeUrl);
          const placeData = await placeRes.json();
          lat = placeData.lat;
          lng = placeData.lng;
        }
      }

      if (lat && lng) {
        form.setValue("latitude", parseFloat(lat));
        form.setValue("longitude", parseFloat(lng));
        toast({ title: "Thành công", description: `Đã cập nhật: Lat ${lat}, Lng ${lng}` });
      } else {
        toast({ title: "Lỗi dữ liệu", description: "Không lấy được tọa độ từ nhà cung cấp.", variant: "destructive" });
      }

    } catch (error) {
      console.error("Geocoding error:", error);
      toast({ title: "Lỗi hệ thống", description: "Có lỗi khi kết nối API bản đồ.", variant: "destructive" });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const province = provinces.find((p) => p.code === parseInt(values.province_code));
    const ward = wards?.find((w) => w.code === parseInt(values.ward_code));

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
        <Card className="glass-effect border-sky-200/50">
          <CardHeader>
            <CardTitle className="gradient-text-ocean">Thông tin cơ bản</CardTitle>
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
                      <Input placeholder="ST001" {...field} disabled={!!initialData} className="border-sky-200 focus:border-sky-500" />
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
                      <Input placeholder="Bến Xe Miền Đông" {...field} className="border-sky-200 focus:border-sky-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ===== ADDRESS SECTION ===== */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sky-700 font-semibold">Tìm kiếm nhanh (Tự động điền)</Label>
                <AddressAutocomplete onSelect={handleAutocompleteSelect} />
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-sky-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Chi tiết địa chỉ</span></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Số nhà, đường *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Đường ABC" {...field} className="border-sky-200 focus:border-sky-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 col-span-2 md:col-span-1">
                  <FormField
                    control={form.control}
                    name="province_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tỉnh/TP *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={onProvinceChange}
                          disabled={isDataLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="border-sky-200 focus:border-sky-500">
                              {isDataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Chọn tỉnh" />}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.code} value={province.code.toString()}>{province.name}</SelectItem>
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
                        {/* Key: force re-render khi value đổi để hiển thị đúng tên */}
                        <Select
                          key={field.value}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isWardLoading || isDataLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="border-sky-200 focus:border-sky-500">
                              {isWardLoading || isDataLoading ? (
                                <div className="flex items-center text-muted-foreground gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs">Đang tải...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder={wards.length > 0 ? "Chọn phường" : "Không có dữ liệu"} />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {wards.length > 0 ? (
                              wards.map((ward) => (
                                <SelectItem key={ward.code} value={ward.code.toString()}>{ward.name}</SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground text-center">Vui lòng chọn Tỉnh trước</div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Coordinates */}
        <Card className="glass-effect border-sky-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="gradient-text-ocean">Tọa độ</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoGeocode}
              disabled={isGeocoding}
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              {isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Lấy tọa độ từ địa chỉ
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="border-sky-200 focus:border-sky-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="border-sky-200 focus:border-sky-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Properties & Facilities */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-effect border-sky-200/50">
            <CardHeader><CardTitle className="gradient-text-ocean">Thuộc tính</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại trạm</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="terminal">Đầu cuối</SelectItem>
                      <SelectItem value="intermediate">Trung gian</SelectItem>
                      <SelectItem value="stop">Điểm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="maintenance">Bảo trì</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sức chứa</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="glass-effect border-sky-200/50">
            <CardHeader><CardTitle className="gradient-text-ocean">Tiện ích</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "waiting_area", label: "Khu vực chờ" },
                { name: "wifi", label: "WiFi miễn phí" },
                { name: "toilet", label: "Nhà vệ sinh" },
                { name: "atm", label: "ATM" },
                { name: "wheelchair_accessible", label: "Hỗ trợ xe lăn" },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  // @ts-ignore
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent">
                      <FormControl><Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>{item.label}</FormLabel></div>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-sky-200 hover:bg-sky-50">
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}