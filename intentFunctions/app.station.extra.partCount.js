const Sevici = require('../sevici');
const {getPartCount} = require("./stationFunctions/extraStationDataFunctions");


module.exports = async (agent) => {
    const conv = agent.conv();
    const responseString = await getPartCount(conv);
    conv.ask(responseString);
    agent.add(conv)
};
