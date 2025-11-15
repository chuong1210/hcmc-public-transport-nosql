// app/dashboard/stations/[id]/page.tsx

import EditStationPage from "../~slug/edit-station-page.";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // 🔥 Quan trọng: unwrap promise
  return <EditStationPage id={id} />;
}
