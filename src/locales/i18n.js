/**
 * Internationalization Service
 * Multi-language support for the application
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import Storage from '@/js/modules/storage/LocalStorage';

class I18nService {
    constructor() {
        this.i18n = null;
        this.storage = new Storage('i18n');
        this.availableLanguages = [
            { code: 'en', name: 'English', flag: '????' },
            { code: 'id', name: 'Bahasa Indonesia', flag: '????' },
            { code: 'fr', name: 'Fran‡ais', flag: '????' },
            { code: 'es', name: 'Espa¤ol', flag: '????' },
            { code: 'de', name: 'Deutsch', flag: '????' },
            { code: 'ja', name: '???', flag: '????' },
            { code: 'zh', name: '??', flag: '????' },
            { code: 'ar', name: '???????', flag: '????' },
        ];
        this.currentLanguage = 'en';
        this.initialized = false;
    }

    /**
     * Initialize i18n service
     */
    async init() {
        try {
            // Get saved language preference
            const savedLanguage = await this.getSavedLanguage();
            
            // Initialize i18next
            this.i18n = i18next
                .use(Backend)
                .use(LanguageDetector)
                .use(initReactI18next)
                .init({
                    fallbackLng: 'en',
                    lng: savedLanguage,
                    supportedLngs: this.availableLanguages.map(lang => lang.code),
                    nonExplicitSupportedLngs: true,
                    debug: process.env.NODE_ENV === 'development',
                    
                    interpolation: {
                        escapeValue: false,
                        format: (value, format, lng) => {
                            if (format === 'uppercase') return value.toUpperCase();
                            if (format === 'lowercase') return value.toLowerCase();
                            if (format === 'capitalize') {
                                return value.charAt(0).toUpperCase() + value.slice(1);
                            }
                            return value;
                        },
                    },

                    detection: {
                        order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
                        caches: ['localStorage'],
                        lookupLocalStorage: 'i18nextLng',
                        lookupFromPathIndex: 0,
                        checkWhitelist: true,
                    },

                    backend: {
                        loadPath: '/locales/{{lng}}.json',
                        crossDomain: true,
                    },

                    react: {
                        useSuspense: true,
                        bindI18n: 'languageChanged loaded',
                        bindI18nStore: 'added removed',
                        transEmptyNodeValue: '',
                        transSupportBasicHtmlNodes: true,
                        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span'],
                    },
                });

            // Set current language
            this.currentLanguage = this.i18n.language;
            this.initialized = true;
            
            console.info(`I18n service initialized with language: ${this.currentLanguage}`);
            
            return this.i18n;
        } catch (error) {
            console.error('Failed to initialize i18n service:', error);
            throw error;
        }
    }

    /**
     * Change application language
     */
    async changeLanguage(languageCode) {
        if (!this.initialized) {
            throw new Error('I18n service not initialized');
        }

        if (!this.isLanguageSupported(languageCode)) {
            throw new Error(`Language "${languageCode}" is not supported`);
        }

        try {
            await this.i18n.changeLanguage(languageCode);
            this.currentLanguage = languageCode;
            
            // Save preference
            await this.saveLanguagePreference(languageCode);
            
            // Emit language change event
            this.emitLanguageChange(languageCode);
            
            return true;
        } catch (error) {
            console.error(`Failed to change language to ${languageCode}:`, error);
            return false;
        }
    }

    /**
     * Get translation
     */
    t(key, options = {}) {
        if (!this.initialized) {
            return key; // Fallback to key if i18n not initialized
        }

        return this.i18n.t(key, options);
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.availableLanguages;
    }

    /**
     * Get language name by code
     */
    getLanguageName(code) {
        const language = this.availableLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    }

    /**
     * Get language flag by code
     */
    getLanguageFlag(code) {
        const language = this.availableLanguages.find(lang => lang.code === code);
        return language ? language.flag : '???';
    }

    /**
     * Check if language is supported
     */
    isLanguageSupported(code) {
        return this.availableLanguages.some(lang => lang.code === code);
    }

    /**
     * Detect browser language
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const mainLang = browserLang.split('-')[0];
        
        return this.isLanguageSupported(mainLang) ? mainLang : 'en';
    }

    /**
     * Format number according to locale
     */
    formatNumber(number, options = {}) {
        return new Intl.NumberFormat(this.currentLanguage, options).format(number);
    }

    /**
     * Format date according to locale
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat(this.currentLanguage, mergedOptions).format(date);
    }

    /**
     * Format currency according to locale
     */
    formatCurrency(amount, currency = 'USD', options = {}) {
        const defaultOptions = {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return new Intl.NumberFormat(this.currentLanguage, mergedOptions).format(amount);
    }

    /**
     * Get text direction for current language
     */
    getTextDirection() {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
    }

    /**
     * Get saved language preference
     */
    async getSavedLanguage() {
        try {
            const saved = await this.storage.get('language');
            if (saved && this.isLanguageSupported(saved)) {
                return saved;
            }
        } catch (error) {
            console.warn('Failed to get saved language:', error);
        }
        
        return this.detectBrowserLanguage();
    }

    /**
     * Save language preference
     */
    async saveLanguagePreference(languageCode) {
        try {
            await this.storage.set('language', languageCode);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }

    /**
     * Emit language change event
     */
    emitLanguageChange(languageCode) {
        const event = new CustomEvent('language:changed', {
            detail: {
                language: languageCode,
                direction: this.getTextDirection(),
                languageName: this.getLanguageName(languageCode),
            },
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Add resource bundle
     */
    async addResourceBundle(languageCode, namespace, resources) {
        if (!this.initialized) {
            throw new Error('I18n service not initialized');
        }

        try {
            this.i18n.addResourceBundle(languageCode, namespace, resources);
            return true;
        } catch (error) {
            console.error(`Failed to add resource bundle for ${languageCode}:`, error);
            return false;
        }
    }

    /**
     * Load missing translations
     */
    async loadMissingTranslations(languages) {
        if (!this.initialized) {
            throw new Error('I18n service not initialized');
        }

        try {
            await this.i18n.loadLanguages(languages);
            return true;
        } catch (error) {
            console.error('Failed to load missing translations:', error);
            return false;
        }
    }

    /**
     * Create translation hook for React components
     */
    createTranslationHook(namespace) {
        if (!this.initialized) {
            return () => ({
                t: (key) => key,
                i18n: null,
                ready: false,
            });
        }

        return () => ({
            t: (key, options) => this.t(`${namespace}:${key}`, options),
            i18n: this.i18n,
            ready: this.initialized,
        });
    }

    /**
     * Get plural form
     */
    getPluralForm(count, singular, plural) {
        const rules = {
            en: (n) => n === 1 ? singular : plural,
            id: (n) => singular, // Indonesian doesn't have plural forms
            fr: (n) => n === 1 ? singular : plural,
            es: (n) => n === 1 ? singular : plural,
            ar: (n) => n === 0 ? singular : n === 1 ? singular : n === 2 ? plural : plural,
        };

        const rule = rules[this.currentLanguage] || rules.en;
        return rule(count);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Cleanup if needed
    }
}

// Create singleton instance
const i18nService = new I18nService();

// Export singleton instance and utility functions
export default i18nService;

// Utility functions for direct use
export const t = (key, options) => i18nService.t(key, options);
export const changeLanguage = (code) => i18nService.changeLanguage(code);
export const getCurrentLanguage = () => i18nService.getCurrentLanguage();
export const formatNumber = (number, options) => i18nService.formatNumber(number, options);
export const formatDate = (date, options) => i18nService.formatDate(date, options);
export const formatCurrency = (amount, currency, options) => 
    i18nService.formatCurrency(amount, currency, options);