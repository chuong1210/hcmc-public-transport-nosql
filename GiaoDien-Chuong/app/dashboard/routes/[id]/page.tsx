"use client"

export default function RouteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Chi Tiết Tuyến</h1>
      <p className="text-muted-foreground">Tuyến ID: {params.id}</p>
    </div>
  )
}
