const moment = require('moment');
const googleMapsClient = require('@google/maps').createClient({
    key: process.env.STATICMAPAPIKEY,
    Promise: Promise
});
const seviciService = require('./sevici');
const geolib = require('geolib');
const configcat = require("configcat-node");
const configCatClient = configcat.createClient(process.env.CONFIGCATKEY);
const io = require('@pm2/io');
const stringService = require("./locale");
const metrics = {
    geocodingCallsSec: io.meter({
        name: 'geocodingCalls/sec',
        id: 'app/geocoding/realtime/requests'
    }),
    geocodingCallsTotal: io.counter({
        name: 'Total geocoding calls',
        id: 'app/geocoding/total/requests'
    }),
    cachedCallsSec: io.meter({
        name: 'geocodingCalls/sec',
        id: 'app/geocoding/realtime/requests'
    }),
    cachedCallsTotal: io.counter({
        name: 'Total geocoding calls',
        id: 'app/geocoding/total/requests'
    }),
};
// Allowed in https://cloud.google.com/maps-platform/terms/maps-service-terms/ Point 3.4
const geoCache = new Map();
const directionsCache = new Map();
module.exports = {
    async getGeoCodePlace(location) {
        const allowed = await configCatClient.getValueAsync('geocodingglobal',  false);
        if (!allowed) return {error: 'FEATURE_NOT_ENABLED_GEOCODING'};
        let query =  location['business-name'] || '';
        query += ` ${location['street-address']}` || '';
        query = query.toLowerCase();
        if (!query) {
            console.error('Empty location', location);
            return { error: 'EMPTY_SEARCH_GEO'};
        }
        // Return cached query if it's less than a set time ago
        const cached = geoCache.get(query);
        if (cached && moment(cached.timestamp).isAfter(moment().subtract(20, 'days'))) {
            metrics.cachedCallsSec.mark();
            metrics.cachedCallsTotal.inc();
            cached.cachedUses++;
            geoCache.set(query, cached);
            console.log(`Returned cached result for "${query}". Cached uses: ${cached.cachedUses}`);
            return cached;
        }
        metrics.geocodingCallsTotal.inc();
        metrics.geocodingCallsSec.mark();
        const response = await googleMapsClient.geocode({
            address: query,
            language: 'es',
            // Seville for biasing
            bounds: {
                north: 37.673415,
                south: 37.077416,
                east: -5.608832,
                west: -6.438637
            },
            region: 'ES'
        }).asPromise();
        console.log(`Got ${response.json.results.length} geocoding results for: ${query}`);
        if (response.json.results.length) {
            const res = {
                // TODO Extract name properly
                // name: response.json.results[0]['address_components'][0]['short_name'],
                name: query,
                coordinates: response.json.results[0].geometry.location,
                timestamp: new Date().getTime(),
                cachedUses: 0
            };
            geoCache.set(query, res);
            return res;
        }
        return { error: 'NO_RESULTS_GEO'}
    },

    async getDirections(start, end, locale, travelTime = false) {
        const [departureStation, destinationStation] = await Promise.all([
            seviciService.searchStation({
                target: {
                    coordinates: start
                },
                freeBikes: true
            }),
            seviciService.searchStation({
                target: {
                    coordinates: end
                },
                freeParking: true
            })
        ]);
        if (!departureStation || !destinationStation) return { error: 'NO_STATION_RESULTS' };
        const key = JSON.stringify({start, end});
        const cached = directionsCache.get(key);
        if (cached) {
            cached.cachedUses++;
            directionsCache.set(key, cached);
            console.log('Returning cached directions');
            return cached;
        }
        let matrix;
        if (travelTime && await configCatClient.getValueAsync('distancematrixglobal',  false)) {
            const query = {
                origins: [departureStation.position],
                destinations: [destinationStation.position],
                mode: 'bicycling',
                units: 'metric',
                language: stringService.getLocale(locale) || 'en',
                timeout: 1500
            };
            const response = await googleMapsClient.distanceMatrix(query).asPromise();
            const result = response.json.rows[0];
            if (result.status !== 'OK') {
                matrix = {
                    distance: response.json.rows[0].elements[0].distance.text,
                    duration: response.json.rows[0].elements[0].duration.text,
                }
            }
        }
        const response = {
            departureStation,
            departureStationDistance: geolib.getDistance(start, departureStation.position),
            destinationStation,
            destinationStationDistance: geolib.getDistance(end, destinationStation.position),
            matrix,
            timestamp: new Date().getTime(),
            cachedUses: 0
        };
        directionsCache.set(key, response);
        return response;

    }
};
