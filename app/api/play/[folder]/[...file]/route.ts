import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { contentType } from "@/lib/storage";

export const dynamic = "force-dynamic";

const FOLDER_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/play/[folder]/[...file]">
) {
  const { folder, file } = await params;

  if (!FOLDER_RE.test(folder)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!file || file.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (
    file.some(
      (seg) => !seg || seg === "." || seg === ".." || /[\\/]/.test(seg)
    )
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const objectPath = [folder, ...file].join("/");
  const { data } = sb.storage.from("games").getPublicUrl(objectPath);

  const upstream = await fetch(data.publicUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileName = file[file.length - 1];
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType(fileName),
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
    },
  });
}