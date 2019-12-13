const { stationSearchRequester } = require("./permissionsHandlerFunctions/station-search");
module.exports = (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        const filter = { closest: true, freeParking: true };
        if (conv.parameters.criteria.includes('furthest')) filter.closest = false;
        conv.data.originalParams = conv.parameters;
        stationSearchRequester(conv, filter, 'To search for somewhere to park');
        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

