const { stationSearchRequester } = require("./permissionsHandlerFunctions/station-search");
const {buildFilter} = require("../utils");
module.exports = (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        const filter = buildFilter(conv.parameters.criteria);
        // TODO Check if these can be removed, and split the 'where is a free dock' and 'where is the closest bike' into seperate intents
        if (conv.parameters.stationPart === 'bicycle') filter.freeBikes = true;
        if (conv.parameters.stationPart === 'free dock') filter.freeParking = true;
        // TODO Remove before once card query removed
        conv.data.originalParams = conv.parameters;
        stationSearchRequester(conv, filter);

        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

