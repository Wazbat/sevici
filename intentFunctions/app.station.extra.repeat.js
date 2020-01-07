const { updateStationContext, generateStationCard, buildStationDetailsString } = require("../utils/general");
const { Suggestions } = require('actions-on-google');

module.exports = async (agent) => {
    const conv = agent.conv();
    const updatedStation = await updateStationContext(conv);
    conv.ask(buildStationDetailsString(updatedStation));
    conv.ask(generateStationCard(updatedStation));
    conv.ask(new Suggestions('Distance from here'));
    agent.add(conv)
};
