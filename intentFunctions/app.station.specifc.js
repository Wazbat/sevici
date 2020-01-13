const { Suggestions } = require('actions-on-google');

const { buildStationDetailsString, generateStationCard } = require("../utils/general");
const seviciService = require("../utils/sevici");
module.exports = async (agent) => {

    // TODO Consider replacing conv with agent to allow for multiple platforms
    const conv = agent.conv();
    let station;
    // TODO Make number optional and also search by name using string similarity and a @sys.any to extract station name
    if (conv.parameters.number) {
        station = await seviciService.getStationByID(conv.parameters.number);
        if (station) {
            conv.ask(buildStationDetailsString(station, conv.user.locale));
            conv.ask(generateStationCard(station, conv.user.locale));
            // Todo Localize
            conv.ask(new Suggestions('Distance from here'));
            conv.contexts.set('station', 5, station);
        } else {
            // Todo Localize
            conv.ask(`I'm sorry, I couldn't find any stations with the ID ${conv.parameters.number}`)
        }
    }

    agent.add(conv)
};
