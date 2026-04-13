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
import Marquee from "../components/Marquee";

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
            description:
              "Sản phẩm mới được đưa lên theo nhịp chọn lọc rõ ràng hơn, thay vì cảm giác tràn ngập như một catalog quá dày.",
            icon: Sparkles,
            tone: "bg-[#fef2f2]",
            iconTone: "bg-white text-rose-500",
          },
          {
            title: "Giao hàng nhanh",
            value: "Toàn quốc",
            description:
              "Vận chuyển, đổi hàng và checkout đều được trình bày rõ để khách đi từ xem đến đặt hàng nhanh hơn.",
            icon: Truck,
            tone: "bg-[#eff6ff]",
            iconTone: "bg-white text-sky-500",
          },
          {
            title: "Tương tác cao cấp",
            value: "UX hiện đại",
            description:
              "Từ mặc thử áo quần đến add-to-cart nhanh, trải nghiệm mua sắm sống động và hiện đại hơn.",
            icon: WandSparkles,
            tone: "bg-[#fff7ed]",
            iconTone: "bg-white text-amber-500",
          },
        ],
        brandStory: 'Câu chuyện thương hiệu',
        brandTitle: 'Một homepage nên bán được cảm giác, không chỉ là lưới sản phẩm.',
        brandText1:
          'ForeverVN nên mang cảm giác của một điểm đến thời trang ngay từ lần chạm đầu tiên. Thay vì kết thúc nhanh sau vài block sản phẩm, trang chủ giờ kéo dài hơn, có nhịp hơn và thuyết phục hơn.',
        brandText2:
          'Mục tiêu rất rõ: dẫn mắt người dùng qua các điểm nhấn, các lựa chọn tuyển chọn và các tín hiệu tin cậy để trang trở nên giàu cảm xúc hơn mà không bị ồn.',
        exploreCollection: 'Khám phá bộ sưu tập',
        meetBrand: 'Về ForeverVN',
        editorialTag: 'Điểm nhấn biên tập',
        editorialTitle: 'Giữ nhịp cuộn trang sống động hơn bằng các block kể chuyện và điểm dừng thị giác rõ hơn.',
        editorialText:
          'Trang chủ không nên dừng lại ngay sau những cụm mua sắm đầu tiên. Các section sâu hơn giúp giải thích thương hiệu, tạo cảm hứng và giữ người xem ở lại lâu hơn trước khi chọn sản phẩm.',
        lookFeel: 'Cảm giác thương hiệu',
        lookFeelTitle: 'Nhiều không khí hơn, nhiều tự tin hơn, nhiều lý do để ở lại hơn.',
        lookFeelText:
          'Kể chuyện homepage tốt hơn sẽ giúp thương hiệu trở nên có chủ đích hơn. Khách hàng không chỉ nhìn thấy sản phẩm, họ còn cảm được tinh thần đứng sau bộ sưu tập.',
        clearerJourney: 'Hành trình rõ hơn',
        clearerJourneyText:
          'Mỗi section giờ đều có nhiệm vụ riêng: truyền cảm hứng, dẫn hướng và chuyển đổi thay vì chỉ xếp chồng module.',
        firstImpression: 'Ấn tượng đầu tốt hơn',
        firstImpressionText:
          'Trang trở nên hoàn chỉnh hơn, có dấu ấn thương hiệu rõ hơn và tạo cảm giác cao cấp hơn ngay từ những nhịp cuộn đầu tiên.',
      };
    }

    return {
      pillars: [
        {
          title: "Curated weekly drops",
          value: "Fresh edits",
          description:
            "New arrivals land in a cleaner, more intentional mix instead of feeling like an endless catalog dump.",
          icon: Sparkles,
          tone: "bg-[#fef2f2]",
          iconTone: "bg-white text-rose-500",
        },
        {
          title: "Fast fulfillment",
          value: "Nationwide",
          description:
            "Delivery, exchange support and checkout flow stay clear so customers can move from browse to order faster.",
          icon: Truck,
          tone: "bg-[#eff6ff]",
          iconTone: "bg-white text-sky-500",
        },
        {
          title: "Premium interaction",
          value: "Modern UX",
          description:
            "From try-on apparel to quick add-to-cart moments, the shopping experience feels more alive.",
          icon: WandSparkles,
          tone: "bg-[#fff7ed]",
          iconTone: "bg-white text-amber-500",
        },
      ],
      brandStory: 'Brand Story',
      brandTitle: 'A homepage that sells the feeling, not only the product grid.',
      brandText1:
        'ForeverVN should feel like a fashion destination the moment people land on it. Instead of ending after a short banner and a few rows of cards, the homepage now carries more narrative, more visual rhythm and more reasons to keep exploring.',
      brandText2:
        'The goal is simple: guide the eye through premium highlights, curated edits and trust signals so the page feels richer, longer and more memorable without becoming noisy.',
      exploreCollection: 'Explore Collection',
      meetBrand: 'Meet ForeverVN',
      editorialTag: 'Editorial Spotlight',
      editorialTitle: 'Keep the scroll alive with richer story blocks and stronger visual stops.',
      editorialText:
        'The homepage should not end right after the first shopping modules. Deeper sections help explain the brand, create aspiration and make visitors stay longer before they choose a product.',
      lookFeel: 'Look and Feel',
      lookFeelTitle: 'More atmosphere, more confidence, more reason to stay.',
      lookFeelText:
        'Richer homepage storytelling helps the brand feel intentional. Customers do not only see products, they understand the mood and direction behind the collection.',
      clearerJourney: 'Clearer journey',
      clearerJourneyText:
        'Each section now has a purpose: inspire, guide and convert instead of simply stacking modules.',
      firstImpression: 'Better first impression',
      firstImpressionText:
        'The page feels more complete, more branded and more premium from the very first scroll.',
    };
  }, [language]);

  return (
    <div className="space-y-10 sm:space-y-14">
      <Marquee />
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

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              {copy.brandText2}
            </p>

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
