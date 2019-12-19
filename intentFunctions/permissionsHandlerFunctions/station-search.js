const geolib = require('geolib');
const seviciService = require('../../sevici');
const { generateStationCard, humanizeStationName, getDirection, buildStationSearchString, getGeoCodePlace } = require("../../utils");
const { Permission } = require('actions-on-google');
module.exports = {
    async stationSearch(conv) {

        const query = conv.data.filter;
        if (conv.parameters.location) {
            // If the user has specified a location
            let target = await getGeoCodePlace(conv.parameters.location);
            if (target) {
                query.coordinates = target.location;
                query.target = target.name;
            } else {
                return conv.ask(`I'm sorry. I couldn't find anywhere in Seville that matched ${conv.parameters.location['business-name']}`);
            }
        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations relative to you. Is there anything else I can help you with?`);
            query.coordinates = location.coordinates;
            query.target = 'you'
        }
        /*
        {
            coordinates: { latitude: 36.8775256, longitude: -5.4021203 },
            formattedAddress: 'Cádiz, Algodonales, 11680',
            zipCode: '11680',
            city: 'Algodonales'
          }
         */
        const user = conv.user;

        const station = await seviciService.searchStation(query);
        if (station) {
            const distance = geolib.getDistance(query.coordinates, station.position);
            const direction = getDirection(query.coordinates, station.position);

            const humanizedName = humanizeStationName(station.name);

            const textMessage = buildStationSearchString(humanizedName, distance, direction, query);
            conv.ask(textMessage);
            conv.ask(generateStationCard(station, { distance, originalParams: conv.data.originalParams }));
            conv.contexts.set('station', 5, station);
        } else {
            let message = `I'm sorry, I couldn't find any stations matching that criteria`;
            //TODO Personalise message based on search criteria
            conv.ask(message)
        }

    },
    /**
     *
     * @param conv Conv object
     * @param filter Filter for station search. Returns the closest station if omitted
     * @param context Optional context to explain why the location is being requested
     */
    stationSearchRequester(conv, context = 'To find stations') {
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        const options = {
            context,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-search';
    }
};
