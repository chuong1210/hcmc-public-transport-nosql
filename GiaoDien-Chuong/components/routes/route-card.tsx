"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Route as RouteIcon,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Eye,
} from "lucide-react";
import type { BusRoute } from "@/types";
import {
  getStatusColor,
  getTypeColor,
  formatCurrency,
  formatDistance,
} from "@/lib/utils";
import Link from "next/link";

interface RouteCardProps {
  route: BusRoute;
  onDelete: (id: string) => void;
}

export function RouteCard({ route, onDelete }: RouteCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <RouteIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Tuyến {route.route_code}: {route.route_name}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {route.description || "Không có mô tả"}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getTypeColor(route.type)}>{route.type}</Badge>
              <Badge className={getStatusColor(route.status)}>
                {route.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {route.operating_hours.start} - {route.operating_hours.end}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(route.fare.adult)}</span>
              </div>
              <div className="text-muted-foreground">
                Khoảng cách: {formatDistance(route.total_distance)}
              </div>
              <div className="text-muted-foreground">
                Tần suất: {route.frequency} phút
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Link href={`/dashboard/routes/${route.route_id}/view`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Xem
          </Button>
        </Link>
        <Link href={`/dashboard/routes/${route.route_id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Sửa
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(route.route_id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa
        </Button>
      </CardFooter>
    </Card>
  );
}
