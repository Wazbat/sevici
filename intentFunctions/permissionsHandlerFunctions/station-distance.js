const { updateStationContext, roundDistance, humanizeStationName, getDirection, getErrorMessage } = require("../../utils/general");
const geolib = require('geolib');
const { Permission, Place, LinkOutSuggestion } = require('actions-on-google');
const buildUrl = require('build-url');
const {getGeoCodePlace} = require("../../utils/geo");
module.exports = {
    async stationDistance (conv) {
        let query = {};
        if (conv.parameters.location) {
            // If the user has specified a location
            const target = await getGeoCodePlace(conv.parameters.location);
            if (target.error) {
                return conv.ask(getErrorMessage(target.error));
            } else {
                query.target = target;
            }
        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(`I'm sorry. I need to access your precise location to do this. Is there anything else I can help you with?`);
            query.target = location;
            query.target.user = true;
        }
        /*
        {
            coordinates: { latitude: 36.8775256, longitude: -5.4021203 },
            formattedAddress: 'Cádiz, Algodonales, 11680',
            zipCode: '11680',
            city: 'Algodonales'
          }
         */

        const station = await updateStationContext(conv);
        const distance = geolib.getDistance(query.target.coordinates, station.position);
        let response = `${humanizeStationName(station.name)} is ${roundDistance(distance)} away to the ${getDirection(query.target.coordinates, station.position)}`;
        if (query.target.name) response += ` from ${query.target.name}`;
        conv.ask(response);
        conv.ask(new LinkOutSuggestion({
            name: 'View on map',
            url: buildUrl('https://www.google.com/maps/dir/', {
                queryParams: {
                    api: 1,
                    destination: `${station.position.lat},${station.position.lng}`
                }
            })
        }))
    },
    getStationDistanceRequester(conv) {
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        const context = 'To find your distance from this station';
        const options = {
            context,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-distance';
    }
};
