import { careerCount } from "@/lib/data";
import { liveNav } from "@/lib/liveNav";
import { Footer } from "./Footer";
import { Header } from "./Header";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const { menus, footer, popular } = await liveNav();
  return (
    <div className="flex min-h-screen flex-col">
      <Header careerCount={careerCount} menus={menus} popular={popular} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer columns={footer} />
    </div>
  );
}
