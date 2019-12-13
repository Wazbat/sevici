const { updateStationContext, generateStationCard, buildStationDetailsString } = require("../utils");

module.exports = async (agent) => {
    const conv = agent.conv();
    const updatedStation = await updateStationContext(conv);
    conv.ask(buildStationDetailsString(updatedStation));
    conv.ask(generateStationCard(updatedStation));
    agent.add(conv)
};
