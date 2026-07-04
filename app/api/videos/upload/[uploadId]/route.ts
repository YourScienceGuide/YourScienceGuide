import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
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

  const { uploadId } = await params;

  try {
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.status === "errored") {
      return Response.json({
        status: "errored",
        error: "Video processing failed",
      });
    }

    if (upload.status === "asset_created" && upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;
      if (playbackId) {
        return Response.json({ status: "ready", playbackId });
      }
    }

    return Response.json({ status: upload.status ?? "waiting" });
  } catch (error) {
    console.error("Mux upload status check failed:", error);
    return Response.json(
      { error: "Failed to check upload status" },
      { status: 500 },
    );
  }
}
