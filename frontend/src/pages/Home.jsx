import { useContext } from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import { ShopContext } from "../context/ShopContext";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  const { addToCart } = useContext(ShopContext);

  return (
    <div>
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy  />
      <NewsletterBox />
      <div className="p-6">
        <button
          onClick={() => addToCart("test-1")}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Add test product
        </button>
      </div>
    </div>
  );
};

export default Home;