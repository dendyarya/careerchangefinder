import { ListingView, listingMeta, listingParams } from "@/components/listing/ListingView";

export const dynamicParams = false;
export const generateStaticParams = () => listingParams("salary");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMeta("salary", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingView kind="salary" slug={(await params).slug} />;
}
