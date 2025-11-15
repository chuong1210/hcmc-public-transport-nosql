"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { setCookie } from "@/lib/cookies"; // Import helper
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.login({ username, password });

      if (response.success) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);

        setCookie("access_token", response.data.access_token, 0.01, {
          secure: process.env.NODE_ENV === "production",
        });
        // Refresh token: dài hạn (7 ngày)
        setCookie("refresh_token", response.data.refresh_token, 7, {
          secure: process.env.NODE_ENV === "production",
        });
        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng ${response.data.user.full_name}`,
        });

        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description:
          error.response?.data?.error || "Vui lòng kiểm tra lại thông tin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Bus className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">Bus Manager</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Nhập thông tin để truy cập hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
