const { Suggestions } = require('actions-on-google');
const stringService = require('../utils/locale');
const utilsService = require('../utils/general');
const seviciService = require('../utils/sevici');
module.exports = async (agent) => {

    // TODO Consider replacing conv with agent to allow for multiple platforms
    const conv = agent.conv();
    if (conv) {
        // TODO Make number optional and also search by name using string similarity and a @sys.any to extract station name
        if (conv.parameters.number) {
            const station = await seviciService.getStationByID(conv.parameters.number);
            if (station) {
                conv.ask(utilsService.buildStationDetailsString(station, conv.user.locale));
                conv.ask(utilsService.generateStationCard(station, conv.user.locale));
                conv.ask(new Suggestions(stringService.getString('distance from here', conv.user.locale)));
                conv.contexts.set('station', 5, station);
            } else {
                conv.ask(stringService.getString('couldnt find any stations with id %{id}' , conv.user.locale).replace('%{id}', conv.parameters.number));
            }
        } else {
            conv.ask('Specific station search but no number supplied')
        }

        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};
