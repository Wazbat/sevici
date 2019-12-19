const { updateStationContext, roundDistance, humanizeStationName, getDirection } = require("../../utils");
const geolib = require('geolib');
const { Permission, Place, LinkOutSuggestion } = require('actions-on-google');
const buildUrl = require('build-url');
module.exports = {
    async stationDistance (conv) {
        const {location} = conv.device;
        /*
        {
            coordinates: { latitude: 36.8775256, longitude: -5.4021203 },
            formattedAddress: 'Cádiz, Algodonales, 11680',
            zipCode: '11680',
            city: 'Algodonales'
          }
         */
        if (!location) return conv.ask(`I'm sorry. I need to access your precise location to do this. Is there anything else I can help you with?`);
        const station = await updateStationContext(conv);
        const distance = geolib.getDistance(location.coordinates, station.position);
        const response = `${humanizeStationName(station.name)} is ${roundDistance(distance)} away to the ${getDirection(location.coordinates, station.position)}`;
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
