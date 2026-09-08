import type { Metadata } from "next";
import VisualIndexRedirect from "./VisualIndexRedirect";

export const metadata: Metadata = {
  title: "Visual index",
  robots: { index: false },
};

/** Old standalone visual index URL; the view now lives on the home page. */
export default function VisualIndexPage() {
  return <VisualIndexRedirect />;
}
