const moment = require('moment');
const googleMapsClient = require('@google/maps').createClient({
    key: process.env.STATICMAPAPIKEY,
    Promise: Promise
});
const seviciService = require('./sevici');
const io = require('@pm2/io');
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
const geoCache = new Map();
const directionsCache = new Map();
module.exports = {
    async getGeoCodePlace(location) {
        let query =  location['business-name'] || '';
        query += location['street-address'] || '';
        query = query.toLowerCase();
        // Return cached query if it's less than a set time ago
        const cached = geoCache.get(query);
        if (cached && moment(cached.timestamp).isAfter(moment().subtract(5, 'days'))) {
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
                name: response.json.results[0]['address_components'][0]['short_name'],
                coordinates: response.json.results[0].geometry.location,
                timestamp: new Date().getTime(),
                cachedUses: 0
            };
            geoCache.set(query, res);
            return res;
        }
    },

    async getDirections(start, end) {
        const departureStation = await seviciService.searchStation({
            target: {
                coordinates: start
            },
            freeBikes: true
        });
        const destinationStation = await seviciService.searchStation({
            target: {
                coordinates: end
            },
            freeParking: true
        });
        let query = {
            origins: [departureStation.position],
            destinations: [destinationStation.position],
            mode: 'bicycling',
            units: 'metric',
            timeout: 1500
        };
        const key = JSON.stringify({start, end});
        const cached = geoCache.get(key);
        if (cached) {
            cached.cachedUses++;
            geoCache.set(key, cached);
            console.log('Returning cached directions');
            return cached;
        }
        const result = await googleMapsClient.distanceMatrix(query).asPromise();
        console.log(result);
        const response = {
            departureStation,
            destinationStation,
            result,
            timestamp: new Date().getTime(),
            cachedUses: 0
        };
        geoCache.set(key, response);
        return response;

    }
};
