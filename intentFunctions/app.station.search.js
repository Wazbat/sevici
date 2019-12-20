const { stationSearchRequester, stationSearch } = require("./permissionsHandlerFunctions/station-search");
const { buildFilter } = require("../utils/general");
module.exports = async (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        conv.data.filter = buildFilter(conv.parameters.criteria);
        if (conv.parameters.location) {
            // If a location is specified
            await stationSearch(conv)
        } else {
            // TODO Remove before once card query removed
            conv.data.originalParams = conv.parameters;
            stationSearchRequester(conv);
        }
        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};

