import { redirect } from "next/navigation";

type Props = {
  params: { locale: string };
  searchParams: { intent?: string };
};

/** Legacy URL — redirects into account area. */
export default function OnboardingRedirectPage({ params, searchParams }: Props) {
  const qs = searchParams.intent === "seller" ? "" : "";
  redirect(`/${params.locale}/account/company/setup${qs}`);
}
