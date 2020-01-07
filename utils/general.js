const geolib = require('geolib');
const _ = require('lodash');
const seviciService = require("./sevici");
const buildUrl = require('build-url');
const { BasicCard, Button, Image }  = require("actions-on-google");
const errorStrings = require('../errors');

module.exports = {
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
     * @returns {string}
     */
    getDirection(origin, destination) {
        const direction = geolib.getCompassDirection(origin, destination);
        const letters = direction.split('');
        const words = letters.map(letter => {
            if (letter === 'N') return 'north';
            if (letter === 'E') return 'east';
            if (letter === 'S') return 'south';
            if (letter === 'W') return 'west';
        });
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
    buildStationSearchString(name, distance, direction, query) {
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
        const distanceString = module.exports.roundDistance(distance);
        string += ` is ${name}, ${distanceString} away to the ${direction}`;
        return string;
    },
    buildStationDetailsString(station) {
        let string = module.exports.humanizeStationName(station.name);
        string += ` has ${station.available_bikes} bikes available and ${station.available_bike_stands} free spaces to park`;
        return string;
    },
    buildStationRouteString(route, query) {
        let string = `The best way to get `;
        // TODO Extract name properly
        if (!query.departure.user) string += `from ${query.departure.name}`;
        string += `to ${query.destination.name} is by collecting one of ${route.departureStation.available_bikes} bikes ` +
            `from ${module.exports.humanizeStationName(route.departureStation.name)}, ${module.exports.roundDistance(route.departureStationDistance)} away, then cycling `;
        if (route.matrix) string += `${route.matrix.duration} `;
        string += `to ${module.exports.humanizeStationName(route.destinationStation.name)} `;
        // TODO Add text that says things like "Which is x meters away from query.destination
        string += `and parking at one of the ${route.destinationStation.available_bike_stands} available spots, ` +
            `${module.exports.roundDistance(route.destinationStationDistance)} away from ${query.destination.name}`;
        return string;
    },
    generateStationCard(station, data = {}) {
        const humanizedName = module.exports.humanizeStationName(station.name);
        let text = '';
        if (data.distance) text += `Distance: **${data.distance} meters**  \n`;

        text += `Available bikes: **${station.available_bikes}**  \n
                Available stands: **${station.available_bike_stands}**  \n
                Total stands: **${station.bike_stands}**  \n
                Address: **${station.address}**  \n
                Status: **${station.status}**  \n`;
        if (data.originalParams && data.originalParams.criteria) text += `Query: **${data.originalParams.criteria.join(' ')}**`;
        return new BasicCard({
            text,
            // subtitle: 'This is a subtitle',
            title: humanizedName,
            buttons: [
                new Button({
                    title: 'View on map',
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
    generateRouteCard(route) {
        let text = `Departure: **${module.exports.humanizeStationName(route.departureStation.name)}**  \n
            Available bikes: **${route.departureStation.available_bikes}** \n
            Destination: **${module.exports.humanizeStationName(route.destinationStation.name)}**  \n
            Available stands: **${route.departureStation.available_bike_stands}** \n`;
        return new BasicCard({
            text,
            // subtitle: 'This is a subtitle',
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
     * @returns {string} Number and unit
     */
    roundDistance(distance) {
        if (distance > 999) return `${_.round(distance/1000, 1)} kilometers`;
        return `${distance} meters`;

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
    },
    getErrorMessage(errorName, language = 'en') {
        const strings = errorStrings[errorName];
        if (!strings) return errorName;
        let message;
        switch (language) {
            case 'en':
            // TODO Check if locales are needed here
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
        return message || errorName;
    }
};
