const { updateStationContext } = require("../../utils/general");
const stringService = require('../../utils/locale');
module.exports = {
    async getPartCount (conv) {
        const updatedStation = await updateStationContext(conv);
        let responseString = '';
        switch (conv.parameters.stationPart) {
            case 'dock':
            case 'free dock':
                // TODO Localize

                responseString = stringService.getString('total of %{stands} stands, with %{unnocupied_stands} unnocupied', conv.user.locale)
                    .replace('%{stands}', updatedStation.bike_stands)
                    .replace('%{unnocupied_stands}', updatedStation.available_bike_stands);
                break;
            case 'bicycle':
                responseString = stringService.getString('theres %{bikes} bikes available, with room to park %{unnocupied_stands} more', conv.user.locale)
                    .replace('%{bikes}', updatedStation.available_bikes)
                    .replace('%{unnocupied_stands}', updatedStation.available_bike_stands);
                break;
            default:
                responseString = stringService.getString('theres %{bikes} bikes, and %{unnocupied_stands} free stands', conv.user.locale)
                    .replace('%{bikes}', updatedStation.available_bikes)
                    .replace('%{unnocupied_stands}', updatedStation.available_bike_stands);
        }
        if (updatedStation.status !== 'OPEN') responseString += ' ' + stringService.getString('aware, the station is currently %{status}', conv.user.locale).replace('%{status}', updatedStation.status);
        return responseString;
    }
};
