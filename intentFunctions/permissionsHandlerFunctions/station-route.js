const geolib = require('geolib');
const seviciService = require('../../utils/sevici');
const stringService = require('../../utils/locale');
const featureFlagService = require('../../utils/featureFlags');
const { getGeoCodePlace, getDirections } = require("../../utils/geo");
const { buildStationRouteString, generateRouteCard } = require("../../utils/general");
const { Permission } = require('actions-on-google');
module.exports = {
    async routeSearch(conv) {
        const query = {};
        if (conv.data.originalParams.departure) {
            // If the user has specified a departure that isn't them
            const target = await getGeoCodePlace(conv.data.originalParams.departure, conv.user.locale, conv.body.session);
            if (target.error) {
                return conv.ask(stringService.getErrorMessage(target.error, conv.user.locale));
            } else {
                query.target = target;
            }

        } else {
            // Check if user location was provided
            let {location} = conv.device;
            if (!location) return conv.ask(stringService.getString('dont have location permission', conv.user.locale));
            query.departure = location;
            query.departure.user = true;
        }
        query.destination = await getGeoCodePlace(conv.data.originalParams.destination, conv.user.locale, conv.body.session);
        if (query.destination.error) return conv.ask(stringService.getErrorMessage(query.destination.error, conv.user.locale));

        const userObject = {
            identifier: conv.body.session,
            country: stringService.getLocale(conv.user.locale)
        };

        const [travelTimeEnabled, pathSettings] = await Promise.all([
            featureFlagService.getValue('navigationRouteEnabled',  false, userObject),
            featureFlagService.getValue('navigationPathParams',  null, userObject)
            ]);
        const route = await getDirections(query.departure.coordinates, query.destination.coordinates, conv.user.locale, conv.body.session, travelTimeEnabled);
        if (!route.error) {

            const textMessage = buildStationRouteString(route, query, conv.user.locale);
            conv.ask(textMessage);
            const routeCard = await generateRouteCard(route, conv.user.locale, pathSettings);
            conv.ask(routeCard);
            conv.contexts.set('route', 5, {
                departureStation: route.departureStation,
                destinationStation: route.destinationStation,
                matrix: route.matrix
            });
        } else {
            conv.ask(stringService.getErrorMessage(route.error, conv.user.locale));
        }

    },
    /**
     *
     * @param conv Conv object
     * @param context Optional context to explain why the location is being requested. Must be a valid permission in locale.js
     */
    stationRouteRequester(conv, context = null) {
        const finalContext = context || stringService.getString('to find a route from you', conv.user.locale);
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        const options = {
            context: finalContext,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-route';
    }
};
