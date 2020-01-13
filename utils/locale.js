

class TranslateService {
    defaultLocale = 'en';
    strings = {
        errors: {
            FEATURE_NOT_ENABLED: {
                "en": "I'm sorry, that feature isn't enabled at the moment",
                "es": "Perdona. Esa funcion no esta disponible en este momento"
            },
            FEATURE_NOT_ENABLED_GEOCODING: {
                "en": "I'm sorry, searching for locations other than your own isn't enabled at the moment",
                "es": "Perdona, pero actualmente no se puede buscar relativo a otros ubicaciones"
            },
            NO_RESULTS_GEO: {
                "en": "I'm sorry. I couldn't find anywhere in Seville that matched",
                "es": "No pude encontrar ningun sitio en Sevilla que coincide"
            },
            NO_STATION_RESULTS: {
                "en": "I couldn't find any stations that mach",
                "es": "Perdona. No coincide ninguna estacion con su busqueda"
            }
        }
    };

    getErrorMessage(error, locale) {
        const strings = this.strings[error];
        if (!strings) return error;
        let message;
        switch (locale || this.defaultLocale) {
            case 'en':
            // TODO Check if locales are actually needed here
            case 'en-AU':
            case 'en-CA':
            case 'en-GB':
            case 'en-IN':
            case 'en-US':
                message = strings['en'];
                break;
            case 'es':
            case 'es-419':
            case 'es-ES':
                message = strings['es'];
                break;
            default:
                message = strings['en'];
        }
        return message || error;
    }
}

module.exports = new TranslateService();
