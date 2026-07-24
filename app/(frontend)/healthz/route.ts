export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "the-straight-path-web",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
