import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "@/keystatic.config";
import { keystaticEnabled } from "@/lib/keystatic-enabled";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });
const handlers = keystaticEnabled ? makeRouteHandler({ config }) : { GET: notFound, POST: notFound };

export const { GET, POST } = handlers;
