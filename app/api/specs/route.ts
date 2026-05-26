import { NextResponse } from "next/server";

import { getBaseUrl } from "@/lib/docs/base";

const PLANNED_MESSAGE =
  "RUI persistence is not available yet. Use POST /api/validate and keep normalizedRui locally until §4 ships.";

export async function POST() {
  const baseUrl = getBaseUrl();

  return NextResponse.json(
    {
      status: "planned",
      message: PLANNED_MESSAGE,
      implementedIn: "§4",
      docs: `${baseUrl}/api/docs`,
      validate: `${baseUrl}/api/validate`,
    },
    { status: 501 },
  );
}
