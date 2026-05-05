import { redirect } from "next/navigation";

/** Old path; canonical home is `/`. */
export default function HomenewRedirectPage() {
  redirect("/");
}
