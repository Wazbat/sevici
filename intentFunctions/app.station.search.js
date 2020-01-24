const { stationSearchRequester, stationSearch } = require("./permissionsHandlerFunctions/station-search");
const utilsService = require("../utils/general");
const stringService = require('../utils/locale');
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.data.filter = utilsService.buildFilter(conv.parameters.criteria);
        if (conv.parameters.location) {
            // If a location is specified
            await stationSearch(conv)
        } else {
            // TODO Remove before once card query removed
            conv.data.originalParams = conv.parameters;
            stationSearchRequester(conv, stringService.getString('to find stations', conv.user.locale));
        }
        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};

