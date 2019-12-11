const { updateStation } = require("../../utils");
module.exports = {
    async getPartCount (conv) {
        const updatedStation = await updateStation(conv);
        let responseString = '';
        switch (conv.parameters.stationPart) {
            case 'dock':
            case 'free dock':
                responseString = `There are a total of ${updatedStation.bike_stands} stands, with ${updatedStation.available_bike_stands} unoccupied.`;
                break;
            case 'bicycle':
                responseString = `There are ${updatedStation.available_bikes} bikes available, with room to park ${updatedStation.available_bike_stands} more.`;
                break;
            default:
                responseString = `There are ${updatedStation.available_bikes} bikes and ${updatedStation.available_bike_stands} free stands.`;
        }
        if (updatedStation.status !== 'OPEN') responseString += ` Be aware, the station is currently ${updatedStation.status}`;
        return responseString;
    }
}
