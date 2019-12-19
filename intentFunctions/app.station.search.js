const { stationSearchRequester, stationSearch } = require("./permissionsHandlerFunctions/station-search");
const { buildFilter } = require("../utils");
module.exports = async (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        if (conv.parameters.location) {
            // If a location is specified
            await stationSearch(conv)
        } else {
            const filter = buildFilter(conv.parameters.criteria);
            // TODO Remove before once card query removed
            conv.data.originalParams = conv.parameters;
            stationSearchRequester(conv, filter);
        }
        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};

