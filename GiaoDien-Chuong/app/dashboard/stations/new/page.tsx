"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { provincesAPI, type Province, type Ward } from "@/lib/provinces";
import { AddressAutocomplete } from "@/components/stations/address-autocomplete";

// Định nghĩa kiểu dữ liệu cho location để cho phép nhập chuỗi rỗng khi đang gõ
interface LocationState {
  latitude: number | string;
  longitude: number | string;
}

export default function StationCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    station_id: "",
    name: "",
    address: {
      street: "",
      ward: "",
      city: "",
    },
    location: {
      latitude: 10.7769 as number | string, // Cho phép string để xử lý khi xóa trống ô input
      longitude: 106.7009 as number | string,
    },
    type: "intermediate",
    status: "active",
    capacity: 10 as number | string,
    facilities: {
      waiting_area: false,
      wifi: false,
      toilet: false,
      atm: false,
      wheelchair_accessible: false,
    },
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number>(79);
  const [loading, setLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    loadProvinces();
    loadWards(79);
  }, []);

  const loadProvinces = async () => {
    try {
      const data = await provincesAPI.getProvinces();
      setProvinces(data);
      const hcmc = data.find((p) => p.code === 79);
      if (hcmc) {
        setFormData((prev) => ({
          ...prev,
          address: { ...prev.address, city: hcmc.name },
        }));
      }
    } catch (error) {
      console.error("Failed to load provinces:", error);
    }
  };

  const loadWards = async (provinceCode: number) => {
    try {
      setLoadingWards(true);
      const data = await provincesAPI.getAllWardsInProvince(provinceCode);
      setWards(data);
    } catch (error) {
      console.error("Failed to load wards:", error);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleProvinceChange = async (provinceCode: string) => {
    const code = parseInt(provinceCode);
    setSelectedProvinceCode(code);
    const province = provinces.find((p) => p.code === code);
    if (province) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          city: province.name,
          ward: "",
        },
      }));
    }
    await loadWards(code);
  };

  const handleWardChange = (wardName: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, ward: wardName },
    }));
  };
  const handleAutocompleteSelect = (data: {
    street: string;
    ward: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    // 1. Tìm mã Tỉnh/Thành phố tương ứng trong danh sách provinces để update select box
    // Vietmap trả về tên (VD: "Thành Phố Hồ Chí Minh"), ta cần tìm code (VD: 79)
    const foundProvince = provinces.find(p =>
      // So sánh tương đối tên (bỏ dấu, chữ hoa thường nếu cần)
      p.name.toLowerCase().includes(data.city.toLowerCase()) ||
      data.city.toLowerCase().includes(p.name.toLowerCase())
    );

    const newProvinceCode = foundProvince ? foundProvince.code : 79; // Mặc định HCM nếu ko tìm thấy

    // Update selected province để load danh sách xã/phường
    if (foundProvince) {
      setSelectedProvinceCode(newProvinceCode);
      loadWards(newProvinceCode);
    }

    // 2. Cập nhật Form Data
    setFormData((prev) => ({
      ...prev,
      address: {
        street: data.street,
        ward: data.ward, // Vietmap trả về tên phường, ta điền thẳng vào
        city: foundProvince ? foundProvince.name : data.city,
      },
      location: {
        latitude: data.lat,
        longitude: data.lng,
      },
    }));
  };
  const handleAutoGeocode = async () => {
    const { street, ward, city } = formData.address;

    if (!street || !city) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa chỉ cụ thể và Tỉnh/Thành phố trước.",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      // Bước 1: Gọi Search API để lấy ref_id
      const fullAddress = `${street}, ${ward ? ward + ", " : ""}${city}`;
      console.log("🚀 Đang tìm:", fullAddress);

      const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
      const encodedAddress = encodeURIComponent(fullAddress);

      const searchUrl = `https://maps.vietmap.vn/api/search/v3?apikey=${apiKey}&text=${encodedAddress}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!Array.isArray(searchData) || searchData.length === 0) {
        toast({
          title: "Không tìm thấy",
          description: "Không tìm thấy địa chỉ này. Vui lòng kiểm tra lại.",
          variant: "destructive",
        });
        return;
      }

      // Lấy kết quả đầu tiên
      const firstResult = searchData[0];
      console.log("📍 Kết quả tìm kiếm:", firstResult);

      // Kiểm tra xem có lat/lng ngay ở đây không (thường là không có với V3)
      let lat = firstResult.lat;
      let lng = firstResult.lng;

      // Bước 2: Nếu không có lat/lng, dùng ref_id để gọi Place API
      if (!lat || !lng) {
        if (firstResult.ref_id) {
          console.log(
            "🔄 Đang lấy chi tiết tọa độ từ ref_id:",
            firstResult.ref_id
          );

          const placeUrl = `https://maps.vietmap.vn/api/place/v3?apikey=${apiKey}&refid=${firstResult.ref_id}`;
          const placeRes = await fetch(placeUrl);
          const placeData = await placeRes.json();

          console.log("🎯 Kết quả Place Detail:", placeData);

          // Place API thường trả về lat/lng ở cấp cao nhất
          lat = placeData.lat;
          lng = placeData.lng;
        }
      }

      // Bước 3: Cập nhật State nếu có tọa độ
      if (lat && lng) {
        setFormData((prev) => ({
          ...prev,
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
        }));

        toast({
          title: "Thành công",
          description: `Đã cập nhật: ${firstResult.name} (Lat: ${lat}, Lng: ${lng})`,
        });
      } else {
        toast({
          title: "Lỗi dữ liệu",
          description:
            "Tìm thấy địa điểm nhưng nhà cung cấp không trả về tọa độ.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi khi kết nối API.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dữ liệu trước khi gửi (chuyển đổi số về đúng định dạng)
    const submitData = {
      ...formData,
      capacity: Number(formData.capacity) || 0,
      location: {
        latitude: Number(formData.location.latitude) || 0,
        longitude: Number(formData.location.longitude) || 0,
      },
    };

    if (!submitData.station_id || !submitData.name) {
      toast({
        title: "Lỗi",
        description: "Thiếu thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }
    if (!submitData.address.street) {
      toast({
        title: "Lỗi",
        description: "Thiếu địa chỉ",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Sử dụng submitData đã được chuẩn hóa số liệu
      const response = await api.createStation(submitData);
      if (response.success) {
        toast({ title: "Thành công", description: "Đã tạo trạm mới" });
        router.push("/dashboard/stations");
      } else {
        throw new Error(response.error || "Failed to create station");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tạo trạm",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <h2 className="text-3xl font-bold tracking-tight">Tạo trạm mới</h2>
          <p className="text-muted-foreground">
            Thêm trạm xe buýt vào hệ thống
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6"> {/* Tăng khoảng cách y-6 */}

              {/* --- THÊM COMPONENT AUTOCOMPLETE VÀO ĐÂY --- */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Tìm kiếm nhanh (Khuyên dùng)</Label>
                <AddressAutocomplete onSelect={handleAutocompleteSelect} />
                <p className="text-xs text-muted-foreground">
                  Nhập tên địa điểm (VD: "Đại học Bách Khoa") để tự động điền địa chỉ và tọa độ.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Hoặc nhập thủ công</span>
                </div>
              </div>
              {/* -------------------------------------------- */}              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="station_id">
                    Mã trạm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="station_id"
                    placeholder="ST001"
                    value={formData.station_id}
                    onChange={(e) =>
                      setFormData({ ...formData, station_id: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên trạm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Bến xe Miền Đông"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Loại trạm</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terminal">Đầu cuối</SelectItem>
                      <SelectItem value="intermediate">Trung gian</SelectItem>
                      <SelectItem value="stop">Điểm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="maintenance">Bảo trì</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Sức chứa (xe)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    // FIX: Thêm ?? "" để tránh lỗi uncontrolled component
                    value={formData.capacity ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        // Nếu xóa trống, set thành chuỗi rỗng để hiển thị, khi submit sẽ convert sau
                        capacity: val === "" ? "" : parseInt(val),
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="street">
                    Địa chỉ cụ thể <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street"
                    placeholder="292 Đinh Bộ Lĩnh"
                    // FIX: Thêm ?? ""
                    value={formData.address.street ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          street: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedProvinceCode.toString()}
                    onValueChange={handleProvinceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ward">
                    Phường/Xã <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.address.ward}
                    onValueChange={handleWardChange}
                    disabled={loadingWards || wards.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingWards ? "Đang tải..." : "Chọn phường/xã"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward.code} value={ward.name}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Tọa độ</CardTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoGeocode}
                disabled={isGeocoding}
              >
                {isGeocoding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                Lấy tọa độ từ địa chỉ
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Vĩ độ (Latitude)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    // FIX: Thêm ?? "" để tránh undefined khi api chưa có kết quả hoặc người dùng xóa
                    value={formData.location.latitude ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          latitude: val === "" ? "" : parseFloat(val),
                        },
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Kinh độ (Longitude)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    // FIX: Thêm ?? ""
                    value={formData.location.longitude ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          longitude: val === "" ? "" : parseFloat(val),
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phần tiện nghi giữ nguyên vì dùng Checkbox (luôn là boolean) */}
          <Card>
            <CardHeader>
              <CardTitle>Tiện nghi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="waiting_area"
                    checked={formData.facilities.waiting_area}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          waiting_area: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="waiting_area" className="text-sm font-medium">
                    Khu vực chờ
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wifi"
                    checked={formData.facilities.wifi}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          wifi: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="wifi" className="text-sm font-medium">
                    WiFi
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="toilet"
                    checked={formData.facilities.toilet}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          toilet: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="toilet" className="text-sm font-medium">
                    Nhà vệ sinh
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="atm"
                    checked={formData.facilities.atm}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          atm: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="atm" className="text-sm font-medium">
                    ATM
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wheelchair_accessible"
                    checked={formData.facilities.wheelchair_accessible}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          wheelchair_accessible: checked as boolean,
                        },
                      })
                    }
                  />
                  <label
                    htmlFor="wheelchair_accessible"
                    className="text-sm font-medium"
                  >
                    Hỗ trợ xe lăn
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/stations">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Đang lưu..." : "Tạo trạm"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
