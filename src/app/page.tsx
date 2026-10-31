import ExploreCategories from "@/components/home/explorer-categories";
import HeroSlider from "@/components/home/hero-slider";
import HowItWorks from "@/components/home/how-it-works";

export default function HomePage() {
  return (
    <main>
      <HeroSlider />
      <HowItWorks />
      <ExploreCategories />
    </main>
  );
}
