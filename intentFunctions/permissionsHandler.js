const geolib = require('geolib');

const specificStationSearch = require("./permissionsHandlerFunctions/station-search");
const stationDistance = require('./permissionsHandlerFunctions/station-distance');

module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        switch (conv.data.event) {
            case 'station-search':
                await specificStationSearch(conv);
                agent.add(conv);
                break;
            case 'station-distance':
                await stationDistance(conv);
                agent.add(conv);
            default:
                throw new Error(`Search handler with unhandled event: ${conv.data.event}`)
        }
    } else {
        throw new Error('No actions on google in permissions handler')
    }
};
