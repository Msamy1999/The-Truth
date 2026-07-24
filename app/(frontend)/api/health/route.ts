import configPromise from "@payload-config";
import { getPayload } from "payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise });
    await payload.count({
      collection: "users",
    });

    return Response.json(
      {
        status: "ok",
        service: "the-straight-path-api",
        database: "ok",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Health check failed", error);

    return Response.json(
      {
        status: "error",
        service: "the-straight-path-api",
        database: "unavailable",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
