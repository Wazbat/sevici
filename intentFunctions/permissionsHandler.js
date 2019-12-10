const geolib = require('geolib');

const { specificStationSearch } = require("../functions/station-search");


module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        if (conv.data.event === 'station-search') {
            await specificStationSearch(conv);
            agent.add(conv)
        } else {
            agent.add(`Search handler with event: ${conv.data.event}`)
        }
    }
};
