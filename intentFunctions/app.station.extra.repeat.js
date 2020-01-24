const utilsService = require('../utils/general');
const { Suggestions } = require('actions-on-google');
const stringService = require('../utils/locale');
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        const updatedStation = await utilsService.updateStationContext(conv);
        conv.ask(utilsService.buildStationDetailsString(updatedStation, conv.user.locale));
        conv.ask(await utilsService.generateStationCard(updatedStation, conv.user.locale));
        conv.ask(new Suggestions(stringService.getString('distance from here', conv.user.locale)));
        agent.add(conv)
    } else {
        agent.add('Not actions on google')
    }

};
