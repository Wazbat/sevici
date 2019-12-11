const { updateStationContext, roundDistance, humanizeStationName, getDirection } = require("../../utils");
const geolib = require('geolib');
module.exports = async (conv) => {
    const { location } = conv.device;
    /*
    {
        coordinates: { latitude: 36.8775256, longitude: -5.4021203 },
        formattedAddress: 'Cádiz, Algodonales, 11680',
        zipCode: '11680',
        city: 'Algodonales'
      }
     */
    if (!location) return conv.ask(`I'm sorry. I need to access your precise location to do this. Is there anything else I can help you with?`);
    await updateStationContext(conv);
    const station = conv.contexts.get('station').parameters;
    const distance = geolib.getDistance(location.coordinates, station.position);
    const response = `${humanizeStationName(station.name)} is ${roundDistance(distance)} away to the ${getDirection(location.coordinates, station.position)}`;
    conv.ask(response);
};
