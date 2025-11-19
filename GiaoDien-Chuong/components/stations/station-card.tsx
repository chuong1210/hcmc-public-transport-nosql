"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, Trash2, Wifi, Accessibility, Eye } from "lucide-react";
import type { Station } from "@/types";
import { getStatusColor, getTypeColor } from "@/lib/utils";
import Link from "next/link";

interface StationCardProps {
  station: Station;
  onDelete: (id: string) => void;
}

export function StationCard({ station, onDelete }: StationCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{station.name}</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              {station.address.street}, {station.address.ward},{" "}
              {station.address.city}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getTypeColor(station.type)}>
                {station.type}
              </Badge>
              <Badge className={getStatusColor(station.status)}>
                {station.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Sức chứa: {station.capacity} xe</span>
              {station.facilities.wifi && (
                <Wifi className="h-4 w-4 text-blue-500" />
              )}
              {station.facilities.wheelchair_accessible && (
                <Accessibility className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Link href={`/dashboard/stations/${station.station_id}/view`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Xem
          </Button>
        </Link>
        <Link href={`/dashboard/stations/${station.station_id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Sửa
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(station.station_id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa
        </Button>
      </CardFooter>
    </Card>
  );
}
