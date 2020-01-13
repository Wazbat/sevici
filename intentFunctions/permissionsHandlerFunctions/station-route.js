const configcat = require("configcat-node");
const configCatClient = configcat.createClient(process.env.CONFIGCATKEY);
const geolib = require('geolib');
const seviciService = require('../../utils/sevici');
const stringService = require('../../utils/locale');
const { getGeoCodePlace, getDirections } = require("../../utils/geo");
const { buildStationRouteString, generateRouteCard } = require("../../utils/general");
const { Permission } = require('actions-on-google');
module.exports = {
    async routeSearch(conv) {
        const query = {};
        if (conv.data.originalParams.departure) {
            // If the user has specified a departure that isn't them
            const target = await getGeoCodePlace(conv.data.originalParams.departure);
            if (target.error) {
                return conv.ask(stringService.getErrorMessage(target.error, conv.user.locale));
            } else {
                query.target = target;
            }

        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations relative to you. Is there anything else I can help you with?`);
            query.departure = location;
            query.departure.user = true;
        }
        query.destination = await getGeoCodePlace(conv.data.originalParams.destination);
        if (query.destination.error) return conv.ask(stringService.getErrorMessage(query.destination.error, conv.user.locale));
        const travelTime = await configCatClient.getValueAsync('distancematrixroute',  false);
        const route = await getDirections(query.departure.coordinates, query.destination.coordinates, travelTime);
        if (!route.error) {

            const textMessage = buildStationRouteString(route, query);
            conv.ask(textMessage);
            conv.ask(generateRouteCard(route));
            conv.contexts.set('route', 5, {
                departureStation: route.departureStation,
                destinationStation: route.destinationStation
            });
        } else {
            conv.ask(stringService.getErrorMessage(route.error, conv.user.locale));
        }

    },
    /**
     *
     * @param conv Conv object
     * @param context Optional context to explain why the location is being requested
     */
    stationRouteRequester(conv, context = 'To find a route from you') {
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        const options = {
            context,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-route';
    }
};
