"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Edit, Trash2, Wrench, Calendar, Eye } from "lucide-react";
import type { Vehicle } from "@/types";
import { getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: (id: string) => void;
}

export function VehicleCard({ vehicle, onDelete }: VehicleCardProps) {
  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bus_16: "16 chỗ",
      bus_40: "40 chỗ",
      bus_60: "60 chỗ",
    };
    return labels[type] || type;
  };

  const getFuelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      diesel: "Dầu diesel",
      cng: "CNG",
      electric: "Điện",
    };
    return labels[type] || type;
  };

  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bus className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{vehicle.license_plate}</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {vehicle.manufacturer} {vehicle.model} ({vehicle.year})
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getStatusColor(vehicle.status)}>
                {vehicle.status}
              </Badge>
              <Badge variant="outline">
                {getVehicleTypeLabel(vehicle.type)}
              </Badge>
              <Badge variant="outline">
                {getFuelTypeLabel(vehicle.fuel_type)}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bus className="h-4 w-4" />
                <span>Sức chứa: {vehicle.capacity} người</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wrench className="h-4 w-4" />
                <span>Tình trạng: {vehicle.condition}</span>
              </div>
              {vehicle.next_maintenance && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Bảo trì tiếp:{" "}
                    {format(new Date(vehicle.next_maintenance), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mt-3">
              {vehicle.features.air_conditioning && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Điều hòa
                </span>
              )}
              {vehicle.features.wifi && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  WiFi
                </span>
              )}
              {vehicle.features.usb_charging && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Sạc USB
                </span>
              )}
              {vehicle.features.wheelchair_lift && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                  Xe lăn
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Link href={`/dashboard/vehicles/${vehicle.vehicle_id}/view`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Xem
          </Button>
        </Link>
        <Link href={`/dashboard/vehicles/${vehicle.vehicle_id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Sửa
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(vehicle.vehicle_id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa
        </Button>
      </CardFooter>
    </Card>
  );
}
