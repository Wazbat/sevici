const geolib = require('geolib');
const Sevici = require('../../sevici');
const seviciService = new Sevici(process.env.JCDECAUXAPIKEY);
const { generateStationCard, humanizeStationName, getDirection, buildStationString } = require("../../utils");
const { Permission } = require('actions-on-google');
module.exports = {
    async stationSearch(conv) {
        const {location} = conv.device;
        /*
        {
            coordinates: { latitude: 36.8775256, longitude: -5.4021203 },
            formattedAddress: 'Cádiz, Algodonales, 11680',
            zipCode: '11680',
            city: 'Algodonales'
          }
         */
        const user = conv.user;
        if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations. Is there anything else I can help you with?`);
        const query = conv.data.filter;
        query.coordinates = location.coordinates;
        const station = await seviciService.searchStation(query);
        const distance = geolib.getDistance(location.coordinates, station.position);
        const direction = getDirection(location.coordinates, station.position);

        const humanizedName = humanizeStationName(station.name);

        const textMessage = buildStationString(humanizedName, distance, direction, query);
        conv.ask(textMessage);
        conv.ask(generateStationCard(station, { distance, originalParams: conv.data.originalParams }));
        conv.contexts.set('station', 5, station);
    },
    stationSearchRequester(conv, filter) {
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        const context = 'To find stations';
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        const options = {
            context,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-search';
        conv.data.filter = filter;
    }
};
