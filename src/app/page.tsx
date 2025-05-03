import Link from "next/link";

import { LatestPost } from "@/components/post";
import { api, HydrateClient } from "@/trpc/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });


  return (
    <>
    <h1 className="text-red-500">mg</h1>
    <ThemeToggle/>
    </>
  );
}
