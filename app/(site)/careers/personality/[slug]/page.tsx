import { ListingView, listingMeta, listingParams } from "@/components/listing/ListingView";

export const dynamicParams = false;
export const generateStaticParams = () => listingParams("personality");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMeta("personality", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingView kind="personality" slug={(await params).slug} />;
}
