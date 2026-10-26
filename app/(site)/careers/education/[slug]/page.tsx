import { ListingView, listingMeta, listingParams } from "@/components/listing/ListingView";

export const dynamicParams = false;
export const generateStaticParams = () => listingParams("education");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMeta("education", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingView kind="education" slug={(await params).slug} />;
}
