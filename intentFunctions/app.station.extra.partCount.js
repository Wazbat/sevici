const Sevici = require('../sevici');
const seviciService = new Sevici(process.env.JCDECAUXAPIKEY);

module.exports = async (agent) => {
    const conv = agent.conv();
    const oldStation = conv.contexts.get('station').parameters;
    const updatedStation = await seviciService.getStation(oldStation.number);
    let responseString = '';
    switch (agent.parameters.stationPart) {
        case 'dock':
        case 'free dock':
            responseString = `There are a total of ${updatedStation.bike_stands} stands, with ${updatedStation.available_bike_stands} unoccupied.`;
            break;
        case 'bicycle':
            responseString = `There are ${updatedStation.available_bikes} bikes available, with room to park ${updatedStation.available_bike_stands} more.`;
            break;
        default:
            responseString = `There are ${updatedStation.available_bikes} bikes and ${updatedStation.bike_stands - updatedStation.available_bikes} free stands.`;
    }
    if (updatedStation.status !== 'OPEN') responseString += ` Be aware, the station is currently ${updatedStation.status}`;
    conv.ask(responseString);
    conv.contexts.set('station', 5, updatedStation);
    agent.add(conv)
};
