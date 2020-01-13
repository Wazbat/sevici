const { getPartCount } = require("./stationFunctions/extraStationDataFunctions");
const { Suggestions } = require('actions-on-google');

module.exports = async (agent) => {
    const conv = agent.conv();
    const responseString = await getPartCount(conv);
    conv.ask(responseString);
    // TODO Localize
    conv.ask(new Suggestions(['Distance from here']));
    agent.add(conv)
};
