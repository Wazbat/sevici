const geolib = require('geolib');
const seviciService = require('../../utils/sevici');
const stringService = require('../../utils/locale');
const { getGeoCodePlace } = require("../../utils/geo");
const { generateStationCard, humanizeStationName, getDirection, buildStationSearchString, roundDistance} = require("../../utils/general");
const { Permission } = require('actions-on-google');
module.exports = {
    async stationSearch(conv) {

        const query = conv.data.filter;
        if (conv.parameters.location) {
            // If the user has specified a location
            const target = await getGeoCodePlace(conv.parameters.location);
            if (target.error) {
                return conv.ask(stringService.getErrorMessage(target.error, conv.user.locale));
            } else {
                query.target = target;
            }

        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(stringService.getString('dont have location permission', conv.user.locale));
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

        const station = await seviciService.searchStation(query);
        if (station) {
            const distance = geolib.getDistance(query.target.coordinates, station.position);
            const direction = getDirection(query.target.coordinates, station.position, conv.user.locale);

            const humanizedName = humanizeStationName(station.name);

            const textMessage = buildStationSearchString(humanizedName, distance, direction, query, conv.user.locale);
            conv.ask(textMessage);
            conv.ask(generateStationCard(station, conv.user.locale, { distance, originalParams: conv.data.originalParams }));
            conv.contexts.set('station', 5, station);
        } else {
            conv.ask(stringService.getErrorMessage('NO_STATION_RESULTS', conv.user.locale));
        }

    },
    /**
     *
     * @param conv Conv object
     * @param context Optional context to explain why the location is being requested
     */
    stationSearchRequester(conv, context = null) {
        const finalContext = context || stringService.getString('to do this', conv.user.locale);
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        const options = {
            finalContext,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-search';
    }
};
