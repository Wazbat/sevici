const { stationSearchRequester } = require("./permissionsHandlerFunctions/station-search");
module.exports = (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        conv.data.filter = { closest: true, freeBikes: true };
        if (conv.parameters.criteria.includes('furthest')) conv.data.filter.closest = false;
        conv.data.originalParams = conv.parameters;
        stationSearchRequester(conv, 'To search for bikes');
        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

