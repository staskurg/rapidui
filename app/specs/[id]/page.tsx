import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSpecById, isValidSpecId } from "@/lib/db";
import { RuiInspector } from "@/lib/review/RuiInspector";
import { SITE_PAGE_TITLES } from "@/lib/site/page-titles";

export const dynamic = "force-dynamic";

type SpecInspectorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SITE_PAGE_TITLES.ruiInspector,
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

  return <RuiInspector spec={spec} variant="page" badge="saved" />;
}
