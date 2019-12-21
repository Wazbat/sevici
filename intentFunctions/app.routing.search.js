const { stationSearchRequester, stationSearch } = require("./permissionsHandlerFunctions/station-search");
module.exports = async (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        conv.data.filter = { closest: true, freeParking: true };
        if (conv.parameters.criteria.includes('furthest')) conv.data.filter.closest = false;
        if (conv.parameters.location) {
            await stationSearch(conv);
        } else {
            stationSearchRequester(conv, 'To search for somewhere to park');
        }
        conv.data.originalParams = conv.parameters;

        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

