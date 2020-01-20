const geolib = require('geolib');
const _ = require('lodash');
const seviciService = require('./sevici');
const stringService = require('./locale');
const buildUrl = require('build-url');
const { BasicCard, Button, Image }  = require("actions-on-google");

module.exports = {
    // TODO Convert to class
    /**
     * Builds a object with optional properties that are later used to search
     * @param criteria
     * @returns {{closest: boolean, freeBikes?: boolean, freeParking?: boolean}}
     */
    buildFilter(criteria) {
        let query = { closest: true };
        if (criteria.includes('furthest')) query.closest = false;
        if (criteria.includes('with bikes')) query.freeBikes = true;
        if (criteria.includes('without bikes')) query.freeBikes = false;
        if (criteria.includes('with free dock')) query.freeParking = true;
        if (criteria.includes('without free dock')) query.freeParking = false;
        return query;
    },
    /**
     * Returns direction of destination coordinates as a long string.
     * Examples: northwest, eastnortheast, south, northnorthwest
     * @param origin Origin coordinates object
     * @param destination Destination coordinates object
     * @param locale {string} Locale of response
     * @returns {string}
     */
    getDirection(origin, destination, locale = null) {
        const directionStrings = {
            N: 'north',
            E: 'east',
            S: 'south',
            W: 'west'
        };
        const localeCode = stringService.getLocale(locale);
        switch (localeCode) {
            case 'es':
                directionStrings.N = 'norte';
                directionStrings.E = 'este';
                directionStrings.S = 'sur';
                directionStrings.W = 'oeste';
                break;
        }
        const direction = geolib.getCompassDirection(origin, destination);
        const letters = direction.split('');
        const words = letters.map(letter => directionStrings[letter]);
        return words.join('');
    },
    /**
     * Builds a first response string using the provided data
     * Used when searching for a station
     * @param name
     * @param distance
     * @param direction
     * @param query
     * @returns {string}
     */
    buildStationSearchString(name, distance, direction, query, locale) {
        const localeCode = stringService.getLocale(locale);
        if (localeCode === 'en') {
            let string = 'The ';
            string += query.closest ? 'closest' : 'furthest';
            string += ` station from ${query.target.name || 'you'} `;
            if (query.freeBikes) {
                string += 'with free bikes'
            } else if (query.freeBikes === false) {
                string += 'without any available bikes';
            }
            if (query.freeParking) {
                if (query.freeBikes || query.freeBikes === false) string += ' and ';
                string += 'with space to dock';
            } else if (query.freeParking === false) {
                if (query.freeBikes || query.freeBikes === false) string += ' and ';
                string += 'without any space to park';
            }
            const distanceString = module.exports.roundDistance(distance, locale);
            string += ` is ${name}, ${distanceString} away to the ${direction}`;
            return string;
        } else if (localeCode === 'es') {
            let string = 'La  estación ';
            string += query.closest ? 'mas cercana' : 'mas lejana';
            string += ` a ${query.target.name || 'ti'} `;
            if (query.freeBikes) {
                string += 'con bicis libres'
            } else if (query.freeBikes === false) {
                string += 'sin bicis libres';
            }
            if (query.freeParking) {
                if (query.freeBikes || query.freeBikes === false) string += ' y ';
                string += 'con espacio para aparcar';
            } else if (query.freeParking === false) {
                if (query.freeBikes || query.freeBikes === false) string += ' y ';
                string += 'sin espacio para aparcar';
            }
            const distanceString = module.exports.roundDistance(distance, locale);
            string += ` es ${name}, a ${distanceString} hacia el ${direction}`;
            return string;
        } else {
            throw new Error(`Unexpected locale code in station search string generation: ${locale}`)
        }

    },
    buildStationDetailsString(station, locale) {
        return stringService.getString('%{station} has ${bikeCount} bikes available and ${standCount} spaces to park', locale)
            .replace('%{station}', module.exports.humanizeStationName(station.name))
            .replace('%{bikeCount}', station.available_bikes)
            .replace('%{standCount}', station.available_bike_stands);
    },
    buildStationRouteString(route, query, locale) {
        const localeCode = stringService.getLocale(locale);
        if (localeCode === 'en') {
            let string = `The best way to get `;
            if (!query.departure.user) string += `from ${query.departure.name} `;
            string += `to ${query.destination.name} is by collecting one of ${route.departureStation.available_bikes} bikes ` +
                `from ${module.exports.humanizeStationName(route.departureStation.name)}, ${module.exports.roundDistance(route.departureStationDistance, locale)} away, then cycling `;
            if (route.matrix) string += `${route.matrix.duration} `;
            string += `to ${module.exports.humanizeStationName(route.destinationStation.name)} `;
            string += `and parking at one of the ${route.destinationStation.available_bike_stands} available spots, ` +
                `${module.exports.roundDistance(route.destinationStationDistance, locale)} away from ${query.destination.name}`;
            return string;
        } else if (localeCode === 'es') {
            let string = `La mejor manera para llegar `;
            if (!query.departure.user) string += `desde ${query.departure.name}`;
            string += `hacia ${query.destination.name} es recojiendo uno de ${route.departureStation.available_bikes} bicis disponibles ` +
                `de ${module.exports.humanizeStationName(route.departureStation.name)}, a ${module.exports.roundDistance(route.departureStationDistance, locale)}, luego viajar `;
            if (route.matrix) string += `${route.matrix.duration} `;
            string += `hacia ${module.exports.humanizeStationName(route.destinationStation.name)} `;
            string += `y aparcar en uno de los ${route.destinationStation.available_bike_stands} sitios disponibles, ` +
                `a ${module.exports.roundDistance(route.destinationStationDistance, locale)} de ${query.destination.name}`;
            return string;
        } else {
            throw new Error(`Unexpected locale code in route string generation: ${locale}`)
        }

    },
    generateStationCard(station, locale, data = {}) {
        const localeCode = stringService.getLocale(locale);
        let text = '';
        if (localeCode === 'en') {
            if (data.distance) text += `Distance: **${data.distance} meters**  \n`;
            text += `Available bikes: **${station.available_bikes}**  \n
                Available stands: **${station.available_bike_stands}**  \n
                Total stands: **${station.bike_stands}**  \n
                Address: **${station.address}**  \n
                Status: **${station.status}**  \n`;
        } else if (localeCode === 'es') {
            if (data.distance) text += `Distancia: **${data.distance} metros**  \n`;
            text += `Bicicletas disponibles: **${station.available_bikes}**  \n
                Espacios de aparcamiento disponibles: **${station.available_bike_stands}**  \n
                Aparcamientos totales: **${station.bike_stands}**  \n
                Direccion: **${station.address}**  \n
                Status: **${station.status}**  \n`;
        } else {
            throw new Error(`Unexpected locale code in station card generation: ${locale}`)
        }
        const humanizedName = module.exports.humanizeStationName(station.name);
        if (data.originalParams && data.originalParams.criteria) text += `Query: **${data.originalParams.criteria.join(' ')}**`;
        return new BasicCard({
            text,
            // subtitle: 'This is a subtitle',
            title: humanizedName,
            buttons: [
                new Button({
                    title: stringService.getString('view on map', locale),
                    url: buildUrl('https://www.google.com/maps/search/', {
                        queryParams: {
                            api: 1,
                            query: `${station.position.lat},${station.position.lng}`
                        }
                    })
                })
            ],
            image: new Image({
                url: buildUrl('https://maps.googleapis.com/maps/api/staticmap', {
                    queryParams: {
                        markers: `${station.position.lat},${station.position.lng}`,
                        size: `700x300`,
                        key: process.env.STATICMAPAPIKEY
                    }
                }),
                alt: 'dock location',
            }),
            display: 'CROPPED',
        })
    },
    generateRouteCard(route, locale, pathSettings = 'weight:5|color:0x4597FFFF') {
        let text = '';
        const localeCode = stringService.getLocale(locale);
        if (localeCode === 'en') {
            text = `Departure: **${module.exports.humanizeStationName(route.departureStation.name)}**  \n
            Available bikes: **${route.departureStation.available_bikes}**  \n
            Destination: **${module.exports.humanizeStationName(route.destinationStation.name)}**  \n
            Available stands: **${route.departureStation.available_bike_stands}**  \n`;
        } else if (localeCode === 'es') {
            text = `Salida: **${module.exports.humanizeStationName(route.departureStation.name)}**  \n
            Bicis disponibles: **${route.departureStation.available_bikes}**  \n
            Destino: **${module.exports.humanizeStationName(route.destinationStation.name)}**  \n
            Aparcamientos disponibles: **${route.departureStation.available_bike_stands}**  \n`;
        } else {
            throw new Error(`Unexpected locale code in route card generation: ${locale}`)
        }
        if (route.matrix && route.matrix.warnings.length) text += route.matrix.warnings.join('  \n');
        return new BasicCard({
            text,
            subtitle: route.matrix ? route.matrix.duration : null,
            title: 'Route',
            buttons: [
                new Button({
                    title: 'View route',
                    url: buildUrl('https://www.google.com/maps/dir/', {
                        queryParams: {
                            api: 1,
                            origin: `${route.departureStation.position.lat},${route.departureStation.position.lng}`,
                            destination: `${route.destinationStation.position.lat},${route.destinationStation.position.lng}`,
                            travelmode: 'bicycling'
                        }
                    })
                })
            ],
            image: new Image({
                url: buildUrl('https://maps.googleapis.com/maps/api/staticmap', {
                    queryParams: {
                        markers: `${route.departureStation.position.lat},${route.departureStation.position.lng}|` +
                            `${route.destinationStation.position.lat},${route.destinationStation.position.lng}`,
                        size: `700x300`,
                        path: `${pathSettings}|enc:${route.matrix.points}`,
                        key: process.env.STATICMAPAPIKEY
                    }
                }),
                alt: 'route',
            }),
            display: 'CROPPED',
        })
    },
    /**
     * Update the conv object context with the station context of the requested station. To be called in any function that already has the station context and doesn't change it.
     * Returns the updated station
     * @param conv
     * @returns {Promise<*>}
     */
    async updateStationContext(conv) {
        const context = conv.contexts.get('station');
        if (!context) throw new Error('No station context');
        const oldStation = context.parameters;
        const updatedStation = await seviciService.getStationByID(oldStation.number);
        conv.contexts.set('station', 5, updatedStation);
        return updatedStation;
    },
    /**
     * Update the route object context with the updated versions of the previous stations To be called in any function that already has the rotue context and doesn't change it.
     * Returns the updated station
     * @param conv
     * @returns {Promise<*>}
     */
    // TODO Implement route extras
    async updateRouteContext(conv) {
        const context = conv.contexts.get('route');
        if (!context) throw new Error('No route context');
        const oldRoute = context.parameters;
        const [departureStation, destinationStation] = await Promise.all([
            seviciService.getStationByID(oldRoute.departureStation.number),
            seviciService.getStationByID(oldRoute.destinationStation.number)
        ]);
        const newRoute = {
            departureStation,
            destinationStation
        };
        conv.contexts.set('route', 5, newRoute);
        return newRoute;
    },
    /**
     * Takes a number, the distance in meters. Rounds to kilometers if greater than 999.
     * Example responses:
     * 22 meters
     * 3.5 kilometers
     * @param distance {number} Distance in meters
     * @param locale {string} Current locale
     * @returns {string} Number and unit
     */
    roundDistance(distance, locale) {
        let units = { km: 'kilometers', m: 'meters'};
        const localeCode = stringService.getLocale(locale);
        switch (localeCode) {
            case 'es':
                units.km = 'kilometros';
                units.m = 'metros';
            break;
        }
        if (distance > 999) return `${_.round(distance/1000, 1)} ${units.km}`;
        return `${distance} ${units.m}`;

    },
    /**
     * Convert sevici station names into a human readable format
     * @param name {string}
     * @returns {string}
     */
    humanizeStationName(name) {
        if (name == null) throw new TypeError('Provided name to humanize is undefined');
        let humanizedName = name.toString().replace(/\d+_/i, '');
        humanizedName = _.startCase(_.toLower(humanizedName));
        return humanizedName;
    }
};
