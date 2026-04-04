import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'forevervn-language';

const LanguageContext = createContext(null);

const getInitialLanguage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'vi' || saved === 'en') {
            return saved;
        }
    } catch {
        // ignore
    }

    if (typeof navigator !== 'undefined') {
        return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
    }

    return 'vi';
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(getInitialLanguage);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // ignore
        }

        if (typeof document !== 'undefined') {
            document.documentElement.lang = language === 'vi' ? 'vi' : 'en';
        }
    }, [language]);

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            toggleLanguage: () => setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi')),
            isVietnamese: language === 'vi',
            isEnglish: language === 'en',
        }),
        [language],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }

    return context;
};
