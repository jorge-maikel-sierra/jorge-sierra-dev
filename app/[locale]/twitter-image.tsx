import { isLocale, loadProfile } from "@/lib/content/load";
import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const alt = "Jorge Sierra — Del caos a la arquitectura";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return renderOgImage(loadProfile(isLocale(locale) ? locale : "es"));
}
