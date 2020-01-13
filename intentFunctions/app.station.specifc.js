const { Suggestions } = require('actions-on-google');
const stringService = require('../utils/locale');
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
            conv.ask(new Suggestions(stringService.getString('distance from here', conv.user.locale)));
            conv.contexts.set('station', 5, station);
        } else {
            conv.ask(stringService.getString('couldnt find any stations with id %{id}' , conv.user.locale).replace('%{id}', conv.parameters.number));
        }
    }

    agent.add(conv)
};
