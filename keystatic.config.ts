import { collection, config, fields } from "@keystatic/core";

/**
 * Keystatic CMS for Guides articles and News.
 * - Local mode while developing (files are written straight into content/guides).
 * - GitHub mode everywhere else: each save is a commit to the repo. Only GitHub users with
 *   write access to dendyarya/careerchangefinder (a private repo) can sign in.
 *   In production /keystatic is also behind Cloudflare Access (runbook: Keamanan website).
 */
export default config({
  storage:
    process.env.NODE_ENV === "development" && process.env.KEYSTATIC_GITHUB !== "1"
      ? { kind: "local" }
      : { kind: "github", repo: { owner: "dendyarya", name: "careerchangefinder" } },
  ui: { brand: { name: "Career Change Finder" } },
  collections: {
    guides: collection({
      label: "Guides",
      slugField: "title",
      path: "content/guides/*",
      format: { contentField: "body" },
      entryLayout: "content",
      columns: ["title", "category", "publishedAt"],
      schema: {
        title: fields.slug({
          name: { label: "Title", validation: { isRequired: true, length: { min: 10, max: 70 } } },
          slug: { label: "Slug", description: "Lowercase words joined by hyphens. Becomes /guides/[slug]." },
        }),
        description: fields.text({
          label: "Meta description",
          description: "70–160 characters. Shown in Google results.",
          multiline: true,
          validation: { isRequired: true, length: { min: 70, max: 160 } },
        }),
        author: fields.text({
          label: "Author",
          defaultValue: "Career Change Finder Editorial Team",
          validation: { isRequired: true },
        }),
        publishedAt: fields.date({ label: "Published", validation: { isRequired: true } }),
        updatedAt: fields.date({ label: "Updated" }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Career change", value: "career-change" },
            { label: "Choosing a major", value: "choosing-a-major" },
          ],
          defaultValue: "career-change",
        }),
        heroImage: fields.image({
          label: "Hero image",
          description: "1600×900 JPG or WebP. Use images you own or that are free to use.",
          directory: "public/images/guides",
          publicPath: "/images/guides/",
        }),
        heroImageAlt: fields.text({ label: "Hero image alt text" }),
        draft: fields.checkbox({ label: "Draft (not published)", defaultValue: true }),
        body: fields.mdx({
          label: "Body",
          options: {
            image: { directory: "public/images/guides", publicPath: "/images/guides/" },
          },
        }),
      },
    }),
    news: collection({
      label: "News",
      slugField: "title",
      path: "content/news/*",
      format: { contentField: "body" },
      entryLayout: "content",
      columns: ["title", "publishedAt"],
      schema: {
        title: fields.slug({
          name: { label: "Headline", validation: { isRequired: true, length: { min: 20, max: 110 } } },
          slug: { label: "Slug", description: "Lowercase words joined by hyphens. Becomes /news/[slug]." },
        }),
        description: fields.text({
          label: "Summary / meta description",
          description: "70–160 characters. Shown under the headline and in Google results.",
          multiline: true,
          validation: { isRequired: true, length: { min: 70, max: 160 } },
        }),
        author: fields.text({
          label: "Byline",
          defaultValue: "Career Change Finder News Desk",
          validation: { isRequired: true },
        }),
        publishedAt: fields.datetime({
          label: "Published (UTC)",
          description: "Date and time in UTC. Jakarta is UTC+7, New York UTC−5.",
          validation: { isRequired: true },
        }),
        updatedAt: fields.datetime({ label: "Updated (UTC)" }),
        heroImage: fields.image({
          label: "Lead image",
          description: "1200×675 PNG, JPG or WebP, at least 1200 px wide (Google News and Discover). Our own charts only.",
          directory: "public/images/news",
          publicPath: "/images/news/",
          validation: { isRequired: true },
        }),
        heroImageAlt: fields.text({ label: "Lead image alt text", validation: { isRequired: true } }),
        heroImageCaption: fields.text({ label: "Lead image caption", description: "e.g. Chart: Career Change Finder. Data: BLS." }),
        draft: fields.checkbox({ label: "Draft (not published)", defaultValue: true }),
        body: fields.mdx({
          label: "Body",
          options: {
            image: { directory: "public/images/news", publicPath: "/images/news/" },
          },
        }),
      },
    }),
  },
});
