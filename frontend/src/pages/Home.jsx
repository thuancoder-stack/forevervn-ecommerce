import BannerSlider from "../components/BannerSlider";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  return (
    <div className="space-y-8 sm:space-y-12">
      <BannerSlider />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;
