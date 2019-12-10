const axios = require('axios');
const geolib = require('geolib');
const _ = require('lodash');
class Sevici {
    constructor(key) {
        this.apiKey = key;
    }
    async findStation(query) {

        let { data:stations } = await axios.get('https://api.jcdecaux.com/vls/v1/stations', {
            params: {
                apiKey: this.apiKey,
                contract: 'seville'
            }
        });
        if (query.freeBikes) {
            stations = stations.filter(station => station.available_bikes > 0);
        } else if(query.freeBikes === false) {
            stations = stations.filter(station => station.available_bikes === 0);
        }
        if (query.freeParking) {
            stations = stations.filter(station => station.available_bike_stands > 0);
        } else if (query.freeParking === false) {
            stations = stations.filter(station => station.available_bike_stands === 0);
        }
        const orderedStations = geolib.orderByDistance(query.coordinates, stations.map(station => station.position));
        let resultCoordinates;
        if (query.closest) {
            resultCoordinates = orderedStations[0];
        } else {
            resultCoordinates = orderedStations[orderedStations.length - 1];
        }
        return stations.filter(station => _.isEqual(station.position, resultCoordinates))[0];

    }
    async searchStations(query) {

        let { data:stations } = await axios.get('https://api.jcdecaux.com/vls/v1/stations', {
            params: {
                apiKey: this.apiKey,
                contract: 'seville'
            }
        });

        const withBikes = stations.filter(station => station.available_bikes > 0);
        const withoutBikes = stations.filter(station => station.available_bikes === 0);
        const withParking = stations.filter(station => station.available_bike_stands > 0);
        const withoutParking = stations.filter(station => station.available_bike_stands === 0);
        let resultStations = [];
        if (query.freeBikes) {
            resultStations = resultStations.concat(withBikes)
        } else if(query.freeBikes === false) {
            resultStations = resultStations.concat(withoutBikes)
        }
        if (query.freeParking) {
            resultStations = resultStations.concat(withParking)
        } else if (query.freeParking === false) {
            resultStations = resultStations.concat(withoutParking)
        }

        return {
            stations,
            withBikes,
            withoutBikes,
            withParking,
            withoutParking,
            resultStations
        }

    }


}

module.exports = Sevici;
