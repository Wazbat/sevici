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
            conv.ask(buildStationDetailsString(station));
            conv.ask(generateStationCard(station));
            conv.contexts.set('station', 5, station);
        } else {
            conv.ask(`I'm sorry, I couldn't find any stations with the ID ${conv.parameters.number}`)
        }
    }

    agent.add(conv)
};
