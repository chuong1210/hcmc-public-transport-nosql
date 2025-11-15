"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sampleQueries = [
  {
    name: "Tất cả trạm",
    query: "FOR station IN stations\n  SORT station.name\n  RETURN station",
  },
  {
    name: "Trạm theo quận",
    query:
      'FOR station IN stations\n  FILTER station.address.district == "Quận 1"\n  RETURN station',
  },
  {
    name: "Tuyến đang hoạt động",
    query:
      'FOR route IN routes\n  FILTER route.status == "active"\n  RETURN route',
  },
  {
    name: "Shortest Path",
    query:
      'FOR v, e, p IN 1..10 OUTBOUND "stations/ST001" connects\n  FILTER v._key == "ST002"\n  LIMIT 1\n  RETURN p',
  },
];

export default function QueryPage() {
  const [query, setQuery] = useState(sampleQueries[0].query);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunQuery = async () => {
    setLoading(true);
    // Simulate query execution
    setTimeout(() => {
      setResults([
        { id: 1, name: "Sample Result 1", value: "Data 1" },
        { id: 2, name: "Sample Result 2", value: "Data 2" },
      ]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Truy vấn</h2>
        <p className="text-muted-foreground">
          Thực hiện truy vấn AQL trên database
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Query Templates */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-semibold mb-4">Mẫu truy vấn</h3>
          {sampleQueries.map((sample, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start"
              onClick={() => setQuery(sample.query)}
            >
              <Code className="mr-2 h-4 w-4" />
              {sample.name}
            </Button>
          ))}
        </div>

        {/* Query Editor & Results */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AQL Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="Nhập truy vấn AQL..."
              />
              <Button onClick={handleRunQuery} disabled={loading}>
                <Play className="mr-2 h-4 w-4" />
                {loading ? "Đang thực thi..." : "Thực thi truy vấn"}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kết quả ({results.length} dòng)</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList>
                    <TabsTrigger value="table">Bảng</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.id}</TableCell>
                            <TableCell>{result.name}</TableCell>
                            <TableCell>{result.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="json">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
