const { updateStationContext, roundDistance, humanizeStationName, getDirection } = require("../../utils/general");
const stringService = require('../../utils/locale');
const geolib = require('geolib');
const { Permission, LinkOutSuggestion, Suggestions } = require('actions-on-google');
const buildUrl = require('build-url');
const {getGeoCodePlace} = require("../../utils/geo");
module.exports = {
    async stationDistance (conv) {
        let query = {};
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

        const station = await updateStationContext(conv);
        const distance = geolib.getDistance(query.target.coordinates, station.position);
        let response = '';
        if (query.target.name) {
            response = stringService.getString('%{station} is %{distance} away to the %{direction} from %{target}')
                .replace('%{station}', humanizeStationName(station.name))
                .replace('%{distance}',roundDistance(distance, conv.user.locale))
                .replace('%{direction}', getDirection(query.target.coordinates, station.position))
                .replace('%{target}', query.target.name);
        } else {
            // TODO Implement this properly... Dummy
            response = stringService.getString('%{station} is %{distance} away to the %{direction}')
                .replace('%{station}', humanizeStationName(station.name))
                .replace('%{distance}',roundDistance(distance, conv.user.locale))
                .replace('%{direction}', getDirection(query.target.coordinates, station.position))
        }
        conv.ask(response);
        conv.ask(new Suggestions([
            stringService.getString('number of bikes', conv.user.locale),
            stringService.getString('number of free spots', conv.user.locale)
        ]));
        conv.ask(new LinkOutSuggestion({
            name: stringService.getString('view on map', conv.user.locale),
            url: buildUrl('https://www.google.com/maps/search/', {
                queryParams: {
                    api: '1',
                    query: `${station.position.lat},${station.position.lng}`
                }
            })
        }));
    },
    getStationDistanceRequester(conv, context = null) {
        const finalContext = context || stringService.getString('to find your distance from this station', conv.user.locale);
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        const options = {
            finalContext,
            permissions,
        };
        conv.ask(new Permission(options));
        conv.data.event = 'station-distance';
    }
};
