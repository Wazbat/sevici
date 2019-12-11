const { Permission } = require('actions-on-google');

const { getDistance } = require("./stationFunctions/extraStationDataFunctions");


module.exports = async (agent) => {
    const conv = agent.conv();
    const permissions = ['DEVICE_PRECISE_LOCATION'];
    const context = 'To find your distance from this station';
    const options = {
        context,
        permissions,
    };
    conv.ask(new Permission(options));
    conv.data.event = 'station-distance';
    agent.add(conv)
};
