import React from 'react';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import NewsletterBox from '../components/NewsletterBox';
import { useLanguage } from '../context/LanguageContext';

const copyByLanguage = {
    vi: {
        title1: 'GI\u1edaI THI\u1ec6U',
        title2: 'CH\u00daNG T\u00d4I',
        intro1:
            'Forever ra \u0111\u1eddi t\u1eeb ni\u1ec1m \u0111am m\u00ea \u0111\u1ed5i m\u1edbi v\u00e0 mong mu\u1ed1n c\u00e1ch m\u1ea1ng h\u00f3a tr\u1ea3i nghi\u1ec7m mua s\u1eafm tr\u1ef1c tuy\u1ebfn. H\u00e0nh tr\u00ecnh c\u1ee7a ch\u00fang t\u00f4i b\u1eaft \u0111\u1ea7u v\u1edbi m\u1ed9t \u00fd t\u01b0\u1edfng \u0111\u01a1n gi\u1ea3n: t\u1ea1o ra n\u1ec1n t\u1ea3ng n\u01a1i kh\u00e1ch h\u00e0ng c\u00f3 th\u1ec3 d\u1ec5 d\u00e0ng kh\u00e1m ph\u00e1, t\u00ecm hi\u1ec3u v\u00e0 mua s\u1eafm nhi\u1ec1u lo\u1ea1i s\u1ea3n ph\u1ea9m ngay t\u1ea1i nh\u00e0.',
        intro2:
            'K\u1ec3 t\u1eeb khi th\u00e0nh l\u1eadp, ch\u00fang t\u00f4i kh\u00f4ng ng\u1eebng n\u1ed7 l\u1ef1c tuy\u1ec3n ch\u1ecdn \u0111a d\u1ea1ng s\u1ea3n ph\u1ea9m ch\u1ea5t l\u01b0\u1ee3ng cao, \u0111\u00e1p \u1ee9ng m\u1ecdi s\u1edf th\u00edch v\u00e0 nhu c\u1ea7u. T\u1eeb th\u1eddi trang v\u00e0 l\u00e0m \u0111\u1eb9p \u0111\u1ebfn \u0111\u1ed3 \u0111i\u1ec7n t\u1eed v\u00e0 \u0111\u1ed3 gia d\u1ee5ng thi\u1ebft y\u1ebfu, ch\u00fang t\u00f4i cung c\u1ea5p b\u1ed9 s\u01b0u t\u1eadp phong ph\u00fa t\u1eeb c\u00e1c th\u01b0\u01a1ng hi\u1ec7u v\u00e0 nh\u00e0 cung c\u1ea5p uy t\u00edn.',
        missionTitle: 'S\u1ee9 m\u1ec7nh c\u1ee7a ch\u00fang t\u00f4i',
        missionBody:
            'S\u1ee9 m\u1ec7nh c\u1ee7a Forever l\u00e0 trao quy\u1ec1n cho kh\u00e1ch h\u00e0ng b\u1eb1ng s\u1ef1 l\u1ef1a ch\u1ecdn, ti\u1ec7n l\u1ee3i v\u00e0 s\u1ef1 t\u1ef1 tin. Ch\u00fang t\u00f4i cam k\u1ebft cung c\u1ea5p tr\u1ea3i nghi\u1ec7m mua s\u1eafm v\u01b0\u1ee3t tr\u1ed9i, t\u1eeb vi\u1ec7c duy\u1ec7t s\u1ea3n ph\u1ea9m \u0111\u1ebfn giao h\u00e0ng t\u1eadn n\u01a1i.',
        why1: 'V\u00cc SAO',
        why2: 'CH\u1eccN CH\u00daNG T\u00d4I',
        qualityTitle: '\u0110\u1ea3m b\u1ea3o ch\u1ea5t l\u01b0\u1ee3ng',
        qualityBody:
            'Ch\u00fang t\u00f4i t\u1ec9 m\u1ec9 l\u1ef1a ch\u1ecdn v\u00e0 ki\u1ec3m \u0111\u1ecbnh t\u1eebng s\u1ea3n ph\u1ea9m \u0111\u1ec3 \u0111\u1ea3m b\u1ea3o \u0111\u00e1p \u1ee9ng ti\u00eau chu\u1ea9n ch\u1ea5t l\u01b0\u1ee3ng nghi\u00eam ng\u1eb7t c\u1ee7a ch\u00fang t\u00f4i.',
        convenienceTitle: 'Ti\u1ec7n l\u1ee3i',
        convenienceBody:
            'V\u1edbi giao di\u1ec7n th\u00e2n thi\u1ec7n v\u00e0 quy tr\u00ecnh \u0111\u1eb7t h\u00e0ng \u0111\u01a1n gi\u1ea3n, mua s\u1eafm ch\u01b0a bao gi\u1edd d\u1ec5 d\u00e0ng \u0111\u1ebfn th\u1ebf.',
        serviceTitle: 'D\u1ecbch v\u1ee5 kh\u00e1ch h\u00e0ng v\u01b0\u1ee3t tr\u1ed9i',
        serviceBody:
            '\u0110\u1ed9i ng\u0169 chuy\u00ean nghi\u1ec7p c\u1ee7a ch\u00fang t\u00f4i lu\u00f4n s\u1eb5n s\u00e0ng h\u1ed7 tr\u1ee3 b\u1ea1n, \u0111\u1ea3m b\u1ea3o s\u1ef1 h\u00e0i l\u00f2ng c\u1ee7a b\u1ea1n l\u00e0 \u01b0u ti\u00ean h\u00e0ng \u0111\u1ea7u.',
    },
    en: {
        title1: 'ABOUT',
        title2: 'US',
        intro1:
            'Forever was born from a passion for innovation and a desire to reshape the online shopping experience. Our journey started with a simple idea: build a place where customers can easily explore, understand and shop for a wide variety of products from home.',
        intro2:
            'Since day one, we have continuously curated a diverse range of high-quality products to match different preferences and everyday needs. From fashion and beauty to electronics and essential lifestyle picks, we bring together trusted brands and reliable suppliers in one polished destination.',
        missionTitle: 'Our Mission',
        missionBody:
            'Forever exists to give customers more choice, more convenience and more confidence. We are committed to delivering a better shopping experience from browsing products to receiving every order at the doorstep.',
        why1: 'WHY',
        why2: 'CHOOSE US',
        qualityTitle: 'Quality Assurance',
        qualityBody:
            'We carefully source and review each product to make sure it meets the quality standards we stand behind.',
        convenienceTitle: 'Convenience',
        convenienceBody:
            'With a user-friendly interface and a streamlined ordering flow, shopping with us stays simple from start to finish.',
        serviceTitle: 'Exceptional Customer Service',
        serviceBody:
            'Our team is always ready to support you and make sure your satisfaction remains the top priority.',
    },
};

const About = () => {
    const { language } = useLanguage();
    const t = copyByLanguage[language];

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="mb-8 text-center">
                    <Title text1={t.title1} text2={t.title2} />
                </div>

                <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
                    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_22px_45px_rgba(15,23,42,0.1)]">
                        <img
                            className="w-full rounded-[22px] object-cover"
                            src={assets.about_img}
                            alt="About Forever"
                        />
                    </div>

                    <div className="space-y-5 text-sm leading-7 text-slate-500 sm:text-base">
                        <p>{t.intro1}</p>
                        <p>{t.intro2}</p>

                        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                            <b className="text-slate-900">{t.missionTitle}</b>
                            <p className="mt-3">{t.missionBody}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <div className="text-center">
                    <Title text1={t.why1} text2={t.why2} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="section-shell p-6 sm:p-7">
                        <b className="text-slate-900">{t.qualityTitle}</b>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            {t.qualityBody}
                        </p>
                    </div>

                    <div className="section-shell p-6 sm:p-7">
                        <b className="text-slate-900">{t.convenienceTitle}</b>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            {t.convenienceBody}
                        </p>
                    </div>

                    <div className="section-shell p-6 sm:p-7">
                        <b className="text-slate-900">{t.serviceTitle}</b>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            {t.serviceBody}
                        </p>
                    </div>
                </div>
            </section>

            <NewsletterBox />
        </div>
    );
};

export default About;
