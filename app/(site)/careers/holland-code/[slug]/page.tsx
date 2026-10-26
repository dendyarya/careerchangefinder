import { ListingView, listingMeta, listingParams } from "@/components/listing/ListingView";

export const dynamicParams = false;
export const generateStaticParams = () => listingParams("holland-code");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMeta("holland-code", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingView kind="holland-code" slug={(await params).slug} />;
}
