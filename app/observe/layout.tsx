import { ObserveSidebar } from "@/components/observe/ObserveSidebar";
import { SiteShell } from "@/components/site/SiteShell";

export default function ObserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell className="h-dvh overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <ObserveSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </SiteShell>
  );
}
