const {getStationDistanceRequester, stationDistance} = require("./permissionsHandlerFunctions/station-distance");
module.exports = async (agent) => {
    const conv = agent.conv();
    // TODO Work out support for other platforms, replacing conv with agents to support other platforms
    if (conv.parameters.location) {
        await stationDistance(conv)
    } else {
        getStationDistanceRequester(conv);
    }
    agent.add(conv)
};
