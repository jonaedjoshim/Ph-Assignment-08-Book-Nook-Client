import ExploreCategories from "@/components/home/explorer-categories";
import HeroSlider from "@/components/home/hero-slider";
import HowItWorks from "@/components/home/how-it-works";
import { LatestBooks } from "@/components/home/latest-books";

export default function HomePage() {
  return (
    <main>
      <HeroSlider />
      <LatestBooks />
      <HowItWorks />
      <ExploreCategories />
    </main>
  );
}
