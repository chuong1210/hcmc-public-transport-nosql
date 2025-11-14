"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Bus } from "lucide-react";

interface RouteVisualizationProps {
  journey: {
    path: string[];
    routes: string[];
    distance: number;
    duration: number;
    cost: number;
  };
}

export function RouteVisualization({ journey }: RouteVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết lộ trình</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {journey.path.map((station, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                {idx < journey.path.length - 1 && (
                  <div className="h-12 w-0.5 bg-border" />
                )}
              </div>

              <div className="flex-1 pt-2">
                <p className="font-medium">{station}</p>
                {idx < journey.routes.length && (
                  <div className="mt-2 flex items-center gap-2">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{journey.routes[idx]}</Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
