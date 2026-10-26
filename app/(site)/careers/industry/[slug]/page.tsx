import { ListingView, listingMeta, listingParams } from "@/components/listing/ListingView";

export const dynamicParams = false;
export const generateStaticParams = () => listingParams("industry");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMeta("industry", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingView kind="industry" slug={(await params).slug} />;
}
