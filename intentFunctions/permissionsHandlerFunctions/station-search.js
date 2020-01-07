const geolib = require('geolib');
const seviciService = require('../../utils/sevici');
const { getGeoCodePlace } = require("../../utils/geo");
const { generateStationCard, humanizeStationName, getDirection, buildStationSearchString, getErrorMessage} = require("../../utils/general");
const { Permission } = require('actions-on-google');
module.exports = {
    async stationSearch(conv) {

        const query = conv.data.filter;
        if (conv.parameters.location) {
            // If the user has specified a location
            const target = await getGeoCodePlace(conv.parameters.location);
            if (target.error) {
                return conv.ask(getErrorMessage(target.error, conv.body.queryResult.languageCode));
            } else {
                query.target = target;
            }

        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations relative to you. Is there anything else I can help you with?`);
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
        const user = conv.user;

        const station = await seviciService.searchStation(query);
        if (station) {
            const distance = geolib.getDistance(query.target.coordinates, station.position);
            const direction = getDirection(query.target.coordinates, station.position);

            const humanizedName = humanizeStationName(station.name);

            const textMessage = buildStationSearchString(humanizedName, distance, direction, query);
            conv.ask(textMessage);
            conv.ask(generateStationCard(station, { distance, originalParams: conv.data.originalParams }));
            conv.contexts.set('station', 5, station);
        } else {
            conv.ask(getErrorMessage('NO_STATION_RESULTS', conv.body.queryResult.languageCode));
        }

    },
    /**
     *
     * @param conv Conv object
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
