const {getStationDistanceRequester} = require("./permissionsHandlerFunctions/station-distance");
module.exports = async (agent) => {
    const conv = agent.conv();
    getStationDistanceRequester(conv);
    agent.add(conv)
};
