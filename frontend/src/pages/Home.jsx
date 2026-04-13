import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, PackageCheck, Sparkles, Truck, WandSparkles } from "lucide-react";

import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";
import Hero from "../components/Hero";
import BannerSlider from "../components/BannerSlider";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import ProductItem from "../components/ProductItem";

const Home = () => {
  const { products } = useContext(ShopContext);
  const { language } = useLanguage();
  const editorialProducts = useMemo(() => products.slice(0, 3), [products]);

  const copy = useMemo(() => {
    if (language === 'vi') {
      return {
        pillars: [
          {
            title: "Ra mắt mới mỗi tuần",
            value: "Gợi ý mới",
            description: "Tuyển chọn kỹ lưỡng, mang đến các phong cách mới nhất mỗi tuần.",
            icon: Sparkles,
            tone: "bg-[#fef2f2]",
            iconTone: "bg-white text-rose-500",
          },
          {
            title: "Giao hàng nhanh",
            value: "Toàn quốc",
            description: "Trải nghiệm mua sắm mượt mà từ chọn đồ, chốt đơn đến giao hàng tốc độ cao.",
            icon: Truck,
            tone: "bg-[#eff6ff]",
            iconTone: "bg-white text-sky-500",
          },
          {
            title: "Tương tác cao cấp",
            value: "UX hiện đại",
            description: "Thử quần áo ảo và tương tác thiết kế trực quan, sống động.",
            icon: WandSparkles,
            tone: "bg-[#fff7ed]",
            iconTone: "bg-white text-amber-500",
          },
        ],
        brandStory: 'Câu chuyện thương hiệu',
        brandTitle: 'Cảm hứng thời trang dệt nên từ những câu chuyện.',
        brandText1: 'ForeverVN mang đến không gian mua sắm tinh tế. Nơi mỗi thiết kế không chỉ là trang phục, mà còn là cá tính và phong cách nghệ thuật độc bản.',
        brandText2: '',
        exploreCollection: 'Khám phá bộ sưu tập',
        meetBrand: 'Về ForeverVN',
        editorialTag: 'Điểm nhấn biên tập',
        editorialTitle: 'Điểm chạm thị giác, khơi nguồn sáng tạo.',
        editorialText: 'Các bộ sưu tập được sắp đặt như một buổi triển lãm nghệ thuật, giúp bạn tận hưởng thời trang thay vì chỉ mua sắm.',
        lookFeel: 'Cảm giác thương hiệu',
        lookFeelTitle: 'Sống động & Tự tin hơn.',
        lookFeelText: 'Khách hàng không chỉ khoác lên mình trang phục, họ đang thể hiện tư duy thẩm mỹ và sự tự tin riêng.',
        clearerJourney: 'Hành trình rõ nét',
        clearerJourneyText: 'Truyền cảm hứng và mua sắm dễ dàng, mượt mà ở mọi điểm chạm.',
        firstImpression: 'Dấu ấn đặc quyền',
        firstImpressionText: 'Định hình phong cách đẳng cấp, mang đến sự trọn vẹn ngay từ ánh nhìn đầu tiên.',
      };
    }

    return {
      pillars: [
        {
          title: "Curated weekly drops",
          value: "Fresh edits",
          description: "Carefully curated selections bringing you the latest trends every week.",
          icon: Sparkles,
          tone: "bg-[#fef2f2]",
          iconTone: "bg-white text-rose-500",
        },
        {
          title: "Fast fulfillment",
          value: "Nationwide",
          description: "Seamless shopping from browsing straight to lightning-fast delivery.",
          icon: Truck,
          tone: "bg-[#eff6ff]",
          iconTone: "bg-white text-sky-500",
        },
        {
          title: "Premium interaction",
          value: "Modern UX",
          description: "Cutting-edge Virtual Try-on and authentic 3D interactions.",
          icon: WandSparkles,
          tone: "bg-[#fff7ed]",
          iconTone: "bg-white text-amber-500",
        },
      ],
      brandStory: 'Brand Story',
      brandTitle: 'Fashion inspiration woven from stories.',
      brandText1: 'ForeverVN offers a sophisticated shopping space. Here, each design is not just clothing, but unique artistic expression.',
      brandText2: '',
      exploreCollection: 'Explore Collection',
      meetBrand: 'Meet ForeverVN',
      editorialTag: 'Editorial Spotlight',
      editorialTitle: 'Visual touchpoints to spark creativity.',
      editorialText: 'Our collections are curated like an art exhibition, helping you enjoy fashion rather than just shopping.',
      lookFeel: 'Look and Feel',
      lookFeelTitle: 'Vibrant & Confident.',
      lookFeelText: "Customers don't just wear clothes; they express their aesthetic mindset and unique confidence.",
      clearerJourney: 'Effortless journey',
      clearerJourneyText: 'Inspiring and effortless shopping without boundries.',
      firstImpression: 'Premium signature',
      firstImpressionText: 'Delivering perfection and styling confidence from the very first glance.',
    };
  }, [language]);

  return (
    <div className="space-y-10 sm:space-y-14">
      <Hero />
      <BannerSlider />
      <BestSeller />
      <NewsletterBox featured />
      <LatestCollection />

      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="section-shell relative overflow-hidden px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_right,rgba(221,232,243,0.95),transparent_58%)] md:block" />

          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {copy.brandStory}
            </p>

            <h2 className="display-font mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              {copy.brandTitle}
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              {copy.brandText1}
            </p>

            {copy.brandText2 && (
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                {copy.brandText2}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/collection"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {copy.exploreCollection}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-700"
              >
                {copy.meetBrand}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {copy.pillars.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className={`section-shell h-full p-6 ${item.tone}`}
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconTone} shadow-[0_14px_28px_rgba(15,23,42,0.08)]`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.title}
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="section-shell relative overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,241,214,0.85),transparent_70%)]" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {copy.editorialTag}
            </p>
            <h2 className="display-font mt-3 max-w-xl text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              {copy.editorialTitle}
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              {copy.editorialText}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {editorialProducts.map((item) => (
                <ProductItem
                  key={item._id}
                  id={item._id}
                  image={item.image}
                  name={item.name}
                  price={item.price}
                  oldPrice={item.oldPrice}
                />
              ))}
            </div>
          </div>
        </article>

        <div className="grid gap-5">
          <article className="section-shell overflow-hidden p-0">
            <div className="grid gap-0 sm:grid-cols-[0.85fr_1.15fr]">
              <img
                src={assets.about_img}
                alt={copy.lookFeel}
                className="h-full min-h-[260px] w-full object-cover"
              />
              <div className="flex flex-col justify-center px-6 py-7 sm:px-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {copy.lookFeel}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                  {copy.lookFeelTitle}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {copy.lookFeelText}
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="section-shell p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fef2f2] text-rose-500">
                <PackageCheck className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {copy.clearerJourney}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {copy.clearerJourneyText}
              </p>
            </article>

            <article className="section-shell p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-sky-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {copy.firstImpression}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {copy.firstImpressionText}
              </p>
            </article>
          </div>
        </div>
      </section>

      <OurPolicy />
    </div>
  );
};

export default Home;
