const { stationRouteRequester, routeSearch } = require("./permissionsHandlerFunctions/station-route");
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.data.originalParams = conv.parameters;
        if (conv.parameters.departure) {
            // If the user provided a departure location, search and handle that
            await routeSearch(conv);
        } else {
            stationRouteRequester(conv, 'To find a route from you');
        }

        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

};

