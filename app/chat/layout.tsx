import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RapidUI — Build a RUI",
  description:
    "Chat with the RapidUI agent to discover, validate, and save operations-first RUIs.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
