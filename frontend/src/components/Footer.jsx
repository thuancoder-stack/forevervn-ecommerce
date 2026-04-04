import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { language } = useLanguage();

    const copy = useMemo(() => {
        if (language === 'vi') {
            return {
                description:
                    'ForeverVN mang \u0111\u1ebfn tr\u1ea3i nghi\u1ec7m mua s\u1eafm th\u1eddi trang hi\u1ec7n \u0111\u1ea1i h\u01a1n: giao di\u1ec7n r\u00f5 r\u00e0ng, ch\u1ecdn s\u1ea3n ph\u1ea9m d\u1ec5 h\u01a1n v\u00e0 h\u00e0nh tr\u00ecnh \u0111\u1eb7t h\u00e0ng m\u01b0\u1ee3t h\u01a1n tr\u00ean m\u1ecdi thi\u1ebft b\u1ecb.',
                company: 'C\u00d4NG TY',
                home: 'Trang ch\u1ee7',
                about: 'Gi\u1edbi thi\u1ec7u',
                collection: 'B\u1ed9 s\u01b0u t\u1eadp',
                contact: 'Li\u00ean h\u1ec7',
                touch: 'LI\u00caN H\u1ec6',
                copyright: 'Copyright 2026 @ forever.com - B\u1ea3o l\u01b0u m\u1ecdi quy\u1ec1n.',
            };
        }

        return {
            description:
                'ForeverVN delivers a cleaner fashion shopping experience with clearer browsing, smoother product discovery and a more polished checkout journey across every device.',
            company: 'COMPANY',
            home: 'Home',
            about: 'About us',
            collection: 'Collection',
            contact: 'Contact',
            touch: 'GET IN TOUCH',
            copyright: 'Copyright 2026 @ forever.com - All rights reserved.',
        };
    }, [language]);

    return (
        <footer className="mt-16 sm:mt-20">
            <div className="section-shell grid gap-10 px-5 py-8 text-sm sm:px-8 lg:grid-cols-[2fr_1fr_1fr] lg:gap-14">
                <div>
                    <img src={assets.logo} className="mb-6 w-32" alt="logo" />
                    <p className="max-w-lg leading-7 text-slate-500">
                        {copy.description}
                    </p>
                </div>

                <div>
                    <p className="mb-5 text-lg font-semibold text-slate-900">{copy.company}</p>
                    <ul className="flex flex-col gap-3 text-slate-500">
                        <li><Link className="hover:text-slate-900" to="/">{copy.home}</Link></li>
                        <li><Link className="hover:text-slate-900" to="/about">{copy.about}</Link></li>
                        <li><Link className="hover:text-slate-900" to="/collection">{copy.collection}</Link></li>
                        <li><Link className="hover:text-slate-900" to="/contact">{copy.contact}</Link></li>
                    </ul>
                </div>

                <div>
                    <p className="mb-5 text-lg font-semibold text-slate-900">{copy.touch}</p>
                    <ul className="flex flex-col gap-3 text-slate-500">
                        <li>0327906061</li>
                        <li>thuanphuc12b9@gmail.com</li>
                    </ul>
                </div>
            </div>

            <div className="px-2 py-6 text-center text-sm text-slate-500">
                <p>{copy.copyright}</p>
            </div>
        </footer>
    );
};

export default Footer;
