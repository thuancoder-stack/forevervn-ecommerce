import React from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import NewsletterBox from '../components/NewsletterBox';
import { useLanguage } from '../context/LanguageContext';

const copyByLanguage = {
    vi: {
        title1: 'LI\u00caN H\u1ec6',
        title2: 'CH\u00daNG T\u00d4I',
        storeTitle: 'C\u1eeda h\u00e0ng c\u1ee7a ch\u00fang t\u00f4i',
        storeAddress: '64 Nh\u01a1n H\u00f2a 5, H\u00f2a An, Li\u00ean Chi\u1ec3u,\n\u0110\u00e0 N\u1eb5ng 550000, Vi\u1ec7t Nam',
        storeContact: 'Tel: (+84) 555-0132\nEmail: admin@forever.com',
        careersTitle: 'C\u01a1 h\u1ed9i t\u1ea1i Forever',
        careersBody: 'T\u00ecm hi\u1ec3u th\u00eam v\u1ec1 \u0111\u1ed9i ng\u0169 v\u00e0 c\u01a1 h\u1ed9i vi\u1ec7c l\u00e0m c\u1ee7a ch\u00fang t\u00f4i.',
        careersCta: 'Kh\u00e1m ph\u00e1 c\u01a1 h\u1ed9i',
        direct1: 'LI\u00caN H\u1ec6',
        direct2: 'TR\u1ef0C TI\u1ebeP',
        email: 'Email',
        phone: '\u0110i\u1ec7n tho\u1ea1i',
    },
    en: {
        title1: 'CONTACT',
        title2: 'US',
        storeTitle: 'Our Store',
        storeAddress: '64 Nhon Hoa 5, Hoa An, Lien Chieu,\nDa Nang 550000, Vietnam',
        storeContact: 'Tel: (+84) 555-0132\nEmail: admin@forever.com',
        careersTitle: 'Careers at Forever',
        careersBody: 'Learn more about our team and the open roles we are building around.',
        careersCta: 'Explore Jobs',
        direct1: 'DIRECT',
        direct2: 'CONTACT',
        email: 'Email',
        phone: 'Phone',
    },
};

const Contact = () => {
    const { language } = useLanguage();
    const t = copyByLanguage[language];

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="mb-8 text-center">
                    <Title text1={t.title1} text2={t.title2} />
                </div>

                <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
                    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_22px_45px_rgba(15,23,42,0.1)]">
                        <img
                            className="w-full rounded-[22px] object-cover"
                            src={assets.contact_img}
                            alt="Contact"
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{t.storeTitle}</p>
                            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-500 sm:text-base">
                                {t.storeAddress}
                            </p>
                            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-500 sm:text-base">
                                {t.storeContact}
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {t.careersTitle}
                            </p>
                            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                                {t.careersBody}
                            </p>
                            <button className="mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800">
                                {t.careersCta}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <div className="text-center">
                    <Title text1={t.direct1} text2={t.direct2} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="section-shell p-6 text-center sm:p-7">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{t.email}</p>
                        <p className="mt-4 text-lg font-semibold text-slate-900">thuanphuc12b9@gmail.com</p>
                    </div>

                    <div className="section-shell p-6 text-center sm:p-7">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{t.phone}</p>
                        <p className="mt-4 text-lg font-semibold text-slate-900">0327 906 061</p>
                    </div>
                </div>
            </section>

            <NewsletterBox />
        </div>
    );
};

export default Contact;
