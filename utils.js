const geolib = require('geolib');
const _ = require('lodash');
const seviciService = require("./sevici");
const buildUrl = require('build-url');
const { BasicCard, Button, Image }  = require("actions-on-google");
const googleMapsClient = require('@google/maps').createClient({
    key: process.env.STATICMAPAPIKEY,
    Promise: Promise
});
const io = require('@pm2/io');
const metrics = {
    geocodingCallsSec: io.meter({
        name: 'geocodingCalls/sec',
        id: 'app/geocoding/realtime/requests'
    }),
    geocodingallsTotal: io.counter({
        name: 'Total geocoding calls',
        id: 'app/geocoding/total/requests'
    }),
};
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
        string += ` station from ${query.target} `;
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
                    url: buildUrl('https://www.google.com/maps/dir/', {
                        queryParams: {
                            api: 1,
                            destination: `${station.position.lat},${station.position.lng}`
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
    /**
     * Update the conv object context with the station context of the requested station. To be called in any function that already has the station context.
     * Returns the updated station
     * @param conv
     * @returns {Promise<*>}
     */
    async updateStationContext(conv) {
        const context = conv.contexts.get('station');
        if (!context) throw new Error('No station context');
        const oldStation = context.parameters;
        const updatedStation = await seviciService.getStation(oldStation.number);
        conv.contexts.set('station', 5, updatedStation);
        return updatedStation;

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
     * @param name
     * @returns {string|void}
     */
    humanizeStationName(name) {
        let humanizedName = name.replace(/\d+_/i, '');
        humanizedName = _.startCase(_.toLower(humanizedName));
        return humanizedName;
    },

    async getGeoCodePlace(location) {
        let query =  location['business-name'] || '';
        query += location['street-address'] || '';
        metrics.geocodingallsTotal.inc();
        metrics.geocodingCallsSec.mark();
        let response = await googleMapsClient.geocode({
            address: query,
            // Bounds around Seville
            bounds: {
                north: 37.673415,
                south: 37.077416,
                east: -5.608832,
                west: -6.438637
            }
        }).asPromise();
        console.log(`Got ${response.json.results.length} geocoding results for`, location);
        if (response.json.results.length) {
            return {
                name: response.json.results[0]['address_components'][0]['short_name'],
                location: response.json.results[0].geometry.location
            };
        }
    }
};
