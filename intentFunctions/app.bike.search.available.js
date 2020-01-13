const { stationSearchRequester, stationSearch } = require("./permissionsHandlerFunctions/station-search");
const stringService = require('../utils/locale');
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.data.filter = { closest: true, freeBikes: true };
        if (conv.parameters.criteria.includes('furthest')) conv.data.filter.closest = false;
        if (conv.parameters.location) {
            await stationSearch(conv);
        } else {
            stationSearchRequester(conv, stringService.getString('to search for bikes', conv.user.locale));
        }
        conv.data.originalParams = conv.parameters;

        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

