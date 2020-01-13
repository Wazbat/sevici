const { updateStationContext, generateStationCard, buildStationDetailsString } = require("../utils/general");
const { Suggestions } = require('actions-on-google');

module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        const updatedStation = await updateStationContext(conv);
        conv.ask(buildStationDetailsString(updatedStation, conv.user.locale));
        conv.ask(generateStationCard(updatedStation, conv.user.locale));
        // TODO Localize
        conv.ask(new Suggestions('Distance from here'));
        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};
