const geolib = require('geolib');
const seviciService = require('../../utils/sevici');
const { getGeoCodePlace, getDirections } = require("../../utils/geo");
const { generateStationCard, humanizeStationName, getDirection, buildStationRouteString } = require("../../utils/general");
const { Permission } = require('actions-on-google');
module.exports = {
    async routeSearch(conv) {
        const query = {};
        if (conv.parameters.departure) {
            // If the user has specified a departure that isn't them
            let target = await getGeoCodePlace(conv.parameters.location);
            if (target) {
                query.departure = target;
            } else {
                return conv.ask(`I'm sorry. I couldn't find anywhere in Seville that matched ${conv.parameters.departure['business-name']}`);
            }
        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations relative to you. Is there anything else I can help you with?`);
            query.departure = location;
            query.departure.user = true;
        }
        query.destination = await getGeoCodePlace(conv.parameters.destination);
        if (!query.destination) return conv.ask(`I'm sorry, I couldn't find anywhere in Seville that matched ${conv.parameters.destination['business-name']}`);

        const route = await getDirections(query.departure.coordinates, query.destination.coordinates, false);
        if (route) {

            // TODO Build result from these places
            console.log(route);
            const distance = geolib.getDistance(query.target.coordinates, station.position);
            const direction = getDirection(query.target.coordinates, station.position);

            // const humanizedName = humanizeStationName(station.name);

            const textMessage = buildStationRouteString(route, query);
            conv.ask(textMessage);
            // conv.ask(generateStationCard(station, { distance, originalParams: conv.data.originalParams }));
            conv.contexts.set('station', 5, route.destinationStation);
        } else {
            let message = `I'm sorry, I couldn't find a route for some reason`;
            //TODO Personalise message based on search criteria
            conv.ask(message)
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
