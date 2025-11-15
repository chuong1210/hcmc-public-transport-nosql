"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Bell, Database, Palette } from "lucide-react";
import { api } from "@/lib/api";
import type { User as UserType } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Profile form
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: false,
    sms_notifications: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        setProfileData({
          full_name: response.data.full_name,
          email: response.data.email,
          phone: response.data.phone || "",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const response = await api.updateUser(user.username, profileData);

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin cá nhân",
        });
        fetchUserData();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.error || "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.updateUser(user.username, {
        password: passwordData.new_password,
      });

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã đổi mật khẩu",
        });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể đổi mật khẩu",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt</h2>
        <p className="text-muted-foreground">
          Quản lý cài đặt tài khoản và ứng dụng
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Bảo mật
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="mr-2 h-4 w-4" />
            Hệ thống
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Tên đăng nhập</Label>
                    <Input
                      id="username"
                      value={user?.username || ""}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò</Label>
                    <Input
                      id="role"
                      value={
                        user?.role === "admin"
                          ? "Quản trị viên"
                          : user?.role === "manager"
                          ? "Quản lý"
                          : "Người dùng"
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit">Lưu thay đổi</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
              <CardDescription>
                Thay đổi mật khẩu và cài đặt bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Mật khẩu mới</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">
                    Xác nhận mật khẩu mới
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit">Đổi mật khẩu</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Thông báo</CardTitle>
              <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo qua Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo qua email về các hoạt động quan trọng
                  </p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      email_notifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo push trên trình duyệt
                  </p>
                </div>
                <Switch
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      push_notifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo qua tin nhắn SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.sms_notifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      sms_notifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>Lưu cài đặt</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
                <CardDescription>
                  Chi tiết về phiên bản và cấu hình
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Phiên bản</span>
                  <span className="text-sm text-muted-foreground">1.0.0</span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-muted-foreground">
                    ArangoDB 3.11
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Backend</span>
                  <span className="text-sm text-muted-foreground">
                    Flask + Python
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Frontend</span>
                  <span className="text-sm text-muted-foreground">
                    Next.js 14
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kết nối Database</CardTitle>
                <CardDescription>Thông tin kết nối ArangoDB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Host</span>
                  <span className="text-sm text-muted-foreground">
                    localhost:8529
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-muted-foreground">
                    bus_management_hcm
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Trạng thái</span>
                  <span className="text-sm text-green-600 font-medium">
                    Đã kết nối
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
