const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRYDSN });

class TranslateService {
    defaultLocale = 'en';
    strings = {
        'dont have location permission' : {
            en : `I'm sorry. I need to access your precise location to do this. Is there anything else I can help you with?`,
            es: `Perdona, pero necesito acceso a tu ubicacion actual para poder hacer esto. Te puedo ayudar con algo mas?`

        }
    };
    errors = {
        FEATURE_NOT_ENABLED: {
            en: "I'm sorry, that feature isn't enabled at the moment",
            es: "Perdona. Esa funcion no esta disponible en este momento"
        },
        FEATURE_NOT_ENABLED_GEOCODING: {
            en: "I'm sorry, searching for locations other than your own isn't enabled at the moment",
            es: "Perdona, pero actualmente no se puede buscar relativo a otros ubicaciones"
        },
        NO_RESULTS_GEO: {
            en: "I'm sorry. I couldn't find anywhere in Seville that matched",
            es: "No pude encontrar ningun sitio en Sevilla que coincide"
        },
        NO_STATION_RESULTS: {
            en: "I couldn't find any stations that mach",
            es: "Perdona. No coincide ninguna estacion con su busqueda"
        }
    };
    getString(identifier, locale) {
        const string = this.strings[identifier];
        if (!string) throw new Error(`No string with identifier: "${identifier}"`);
        return string[this.getLocale(locale)];
    }
    getErrorMessage(error, locale) {
        const string = this.errors[error];
        if (!string) {
            Sentry.withScope(scope => {
                scope.setExtra('error', error);
                scope.setExtra('locale', locale);
                Sentry.captureException('No error for code');
            });
            return error;
        }
        let message = string[this.getLocale(locale)];
        return message || error;
    }
    getLocale(identifier) {
        switch (identifier) {
            case 'en':
            case 'en-AU':
            case 'en-CA':
            case 'en-GB':
            case 'en-IN':
            case 'en-US':
                return 'en';
            case 'es':
            case 'es-419':
            case 'es-ES':
                return 'es';
            default:
                return this.defaultLocale;
        }
    }
}

module.exports = new TranslateService();
