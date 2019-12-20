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
        console.log(`Got ${response.json.results.length} geocoding results for`, location['business-name']);
        if (response.json.results.length) {
            return {
                name: response.json.results[0]['address_components'][0]['short_name'],
                coordinates: response.json.results[0].geometry.location
            };
        }
    }
};
