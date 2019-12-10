const {buildFilter} = require("../utils");
const { Permission, Place} = require('actions-on-google');
module.exports = (agent) => {
    console.log('Station search intent');
    const conv = agent.conv();
    if (conv) {
        // Only enters if requestSource === PLATFORMS.ACTIONS_ON_GOOGLE
        const permissions = ['DEVICE_PRECISE_LOCATION'];
        const context = 'To find stations';
        // Location permissions only work for verified users
        // https://developers.google.com/actions/assistant/guest-users
        if (conv.user.verification === 'VERIFIED') {
            // Could use DEVICE_COARSE_LOCATION instead for city, zip code
            // permissions = ['DEVICE_PRECISE_LOCATION'];
            // context += 'To know your location';
        }
        const options = {
            context,
            permissions,
        };
        conv.ask(new Permission(options));

        const filter = buildFilter(agent.parameters.criteria);
        if (agent.parameters.stationPart === 'bicycle') filter.freeBikes = true;
        if (agent.parameters.stationPart === 'free dock') filter.freeParking = true;
        conv.data.event = 'station-search';
        conv.data.filter = filter;
        conv.data.originalParams = agent.parameters;

        agent.add(conv)

    } else {
        agent.add('Not actions on google')
    }

}
