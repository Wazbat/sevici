const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRYDSN });

class TranslateService {
    defaultLocale = 'en';
    strings = {
        'dont have location permission' : {
            en : `I'm sorry. I need to access your precise location to do this. Is there anything else I can help you with?`,
            es: `Perdona, pero necesito acceso a tu ubicacion actual para poder hacer esto. Te puedo ayudar con algo mas?`
        },
        'welcome to the helper': {
            en: 'Welcome to Sevici Helper. What can I help you with today?',
            es: 'Bienvenido al asistente. Como te puedo ayudar?'
        },
        '%{station} is %{distance} away to the %{direction} from %{target}': {
            en: '%{station} is %{distance} away to the %{direction} from %{target}',
            es: '%{station} esta a %{distance} hacia el %{direction} de %{target}'
        },
        '%{station} is %{distance} away to the %{direction}': {
            en: '%{station} is %{distance} away to the %{direction}',
            es: '%{station} esta a %{distance} hacia el %{direction}'
        },
        '%{station} has ${bikeCount} bikes available and ${standCount} spaces to park': {
            en: '%{station} has ${bikeCount} available bikes and ${standCount} spaces to park',
            es: '%{station} tiene ${bikeCount} available bikes and ${standCount} spaces to park'
        },
        // Suggestion Chips and actions
        'closest available bike': {
            en: 'Closest available bike',
            es: 'Bicicleta mas cercana'
        },
        'closest available dock': {
            en: 'Closest available dock',
            es: 'Aparcamiento cercano'
        },
        'number of bikes': {
            en: 'Number of bikes',
            es: 'Cantidad de bicis'
        },
        'number of free spots': {
            en: 'Number of free spots',
            es: 'Espacios libres'
        },
        'view on map': {
            en: 'View on Map',
            es: 'Ver en Mapa'
        },
        // Permission prompts
        'to do this': {
            en: 'To do this',
            es: 'Para hacer esto'
        },
        'to search for bikes': {
            en: 'To search for bikes',
            es: 'Para encontrar bicicletas'
        },
        'to search for somewhere to park': {
            en: 'To search for somewhere to park',
            es: 'Para buscar un lugar donde aparcar'
        },
        'to find a route from you': {
            en: 'To find a route from you',
            es: 'Para buscar una ruta desde ti'
        },
        'to find your distance from this station': {
            en: 'To find your distance from this station',
            es: 'Para calcular tu distancia desde esta estacion'
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
