import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl;

  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return Response.json(
      { error: "Video upload is not available right now." },
      { status: 500 },
    );
  }

  try {
    const upload = await mux.video.uploads.create({
      cors_origin: getCorsOrigin(request),
      new_asset_settings: {
        playback_policies: ["public"],
        passthrough: userId,
        video_quality: "basic",
      },
    });

    return Response.json({
      uploadId: upload.id,
      url: upload.url,
    });
  } catch (error) {
    console.error("Mux upload creation failed:", error);
    return Response.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
}
