import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "@/keystatic.config";
import { keystaticEnabled } from "@/lib/keystatic-enabled";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

// Behind Nginx the app sees its own address (127.0.0.1:3101), and Keystatic builds the GitHub OAuth
// redirect from the request URL. Give it the public origin of the site the CMS runs on.
const PUBLIC_ORIGIN = process.env.SITE_ENV === "staging" ? "https://staging.careerchangefinder.com" : null;

type Handler = (req: Request) => Promise<Response>;
const withPublicOrigin =
  (h: Handler): Handler =>
  (req) => {
    if (!PUBLIC_ORIGIN) return h(req);
    const u = new URL(req.url);
    return h(new Request(new URL(u.pathname + u.search, PUBLIC_ORIGIN), req));
  };

const handlers = keystaticEnabled ? makeRouteHandler({ config }) : null;

export const GET = handlers ? withPublicOrigin(handlers.GET) : notFound;
export const POST = handlers ? withPublicOrigin(handlers.POST) : notFound;
