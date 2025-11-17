"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Route,
  Navigation,
  Search,
  BarChart3,
  Settings,
  LogOut,
  Bus,
  Calendar,
  Car,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  roles: ("admin" | "manager" | "user")[];
}

const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["admin", "manager", "user"],
  },
  {
    title: "Quản lý Trạm",
    icon: MapPin,
    href: "/dashboard/stations",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý Tuyến",
    icon: Route,
    href: "/dashboard/routes",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý Xe",
    icon: Car,
    href: "/dashboard/vehicles",
    roles: ["admin", "manager"],
  },
  {
    title: "Lịch trình",
    icon: Calendar,
    href: "/dashboard/schedules",
    roles: ["admin", "manager"],
  },
  {
    title: "Tìm lộ trình",
    icon: Navigation,
    href: "/dashboard/journey",
    roles: ["admin", "manager", "user"],
  },
  {
    title: "Truy vấn",
    icon: Search,
    href: "/dashboard/query",
    roles: ["admin", "manager"],
  },
  {
    title: "Thống kê",
    icon: BarChart3,
    href: "/dashboard/analytics",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý User",
    icon: Users,
    href: "/dashboard/users",
    roles: ["admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  // Filter menu items based on user role
  const allowedMenuItems = allMenuItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  if (loading) {
    return (
      <div className="flex h-screen w-64 items-center justify-center bg-white border-r">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Bus className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">Bus Manager</span>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b">
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user.role}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Settings & Logout */}
      <div className="space-y-1 p-3">
        {user?.role === "admin" && (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent"
          >
            <Settings className="h-5 w-5" />
            Cài đặt
          </Link>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
