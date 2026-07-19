import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSpecById, isValidSpecId } from "@/lib/db";
import { RuiInspector } from "@/lib/review/RuiInspector";

export const dynamic = "force-dynamic";

type SpecInspectorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SpecInspectorPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!isValidSpecId(id)) {
    return { title: "Not Found — RUI Inspector" };
  }

  const spec = await getSpecById(id);
  if (!spec) {
    return { title: "Not Found — RUI Inspector" };
  }

  return {
    title: `${spec.normalizedRui.app.title} — RUI Inspector`,
  };
}

export default async function SpecInspectorPage({ params }: SpecInspectorPageProps) {
  const { id } = await params;

  if (!isValidSpecId(id)) {
    notFound();
  }

  const spec = await getSpecById(id);
  if (!spec) {
    notFound();
  }

  return <RuiInspector spec={spec} />;
}
