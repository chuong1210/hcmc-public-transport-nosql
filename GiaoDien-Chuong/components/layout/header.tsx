"use client";

import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User as UserType } from "@/types";
import { deleteCookie } from "@/lib/cookies";

export function Header() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.getCurrentUser();
        if (response.success) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    deleteCookie("access_token", {
      secure: process.env.NODE_ENV === "production",
    });
    deleteCookie("refresh_token", {
      secure: process.env.NODE_ENV === "production",
    });
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-sky-200/50 bg-white/80 backdrop-blur-xl px-6 shadow-lg shadow-sky-100/50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold linear-text-ocean">
          Hệ thống Quản lý Xe buýt TP.HCM
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50 hover:text-sky-600 transition-all duration-300 rounded-xl"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-linear-to-r from-red-500 to-pink-500 border-2 border-white shadow-lg animate-pulse"></span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50 hover:text-sky-700 transition-all duration-300 rounded-xl px-3"
            >
              <Avatar className="h-8 w-8 border-2 border-sky-200 shadow-lg shadow-sky-500/20">
                <AvatarFallback className="bg-linear-to-br from-sky-500 to-cyan-500 text-white font-semibold text-xs">
                  {user ? getInitials(user.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900">
                  {user?.full_name || "User"}
                </span>
                <span className="text-xs text-sky-600 font-medium capitalize">
                  {user?.role === "admin"
                    ? "Quản trị viên"
                    : user?.role === "manager"
                    ? "Quản lý"
                    : "Người dùng"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 glass-effect shadow-xl border-sky-200/50"
          >
            <DropdownMenuLabel className="text-gray-900">
              Tài khoản của tôi
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sky-200/50" />
            <DropdownMenuItem className="hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50 hover:text-sky-700 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-linear-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
