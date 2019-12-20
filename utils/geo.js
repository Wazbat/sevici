const moment = require('moment');
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
module.exports = {
    async getGeoCodePlace(location) {
        let query =  location['business-name'] || '';
        query += location['street-address'] || '';
        // Return cached query if it's less than a set time ago
        const cached = geoCache.get(query);
        if (cached && moment(cached.timestamp).isAfter(moment().subtract(5, 'days'))) {
            metrics.cachedCallsSec.mark();
            metrics.cachedCallsTotal.inc();
            cached.cachedUses++;
            geoCache.set(cached);
            console.log(`Returned cached result for ${query}. Uses so far: ${cached.cachedUses}`);
            return cached;
        }
        metrics.geocodingCallsTotal.inc();
        metrics.geocodingCallsSec.mark();
        const response = await googleMapsClient.geocode({
            address: query,
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
    }
};
