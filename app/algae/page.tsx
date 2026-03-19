import { redirect } from "next/navigation";

type AlgaeLegacyPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

/** Old `/algae` URL → merged home page (preserves ?q= search queries). */
export default async function AlgaeIndexLegacyRedirect({ searchParams }: AlgaeLegacyPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const q = resolved.q?.trim();
  if (q) {
    redirect(`/?q=${encodeURIComponent(q)}`);
  }
  redirect("/");
}
