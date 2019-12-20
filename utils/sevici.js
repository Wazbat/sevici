const axios = require('axios');
const geolib = require('geolib');
const _ = require('lodash');
const io = require('@pm2/io');
const metrics = {
    seviciCallsSec: io.meter({
        name: 'jcdecauxCalls/sec',
        id: 'app/api/realtime/requests'
    }),
    seviciCallsTotal: io.counter({
        name: 'Total jcdecaux calls',
        id: 'app/api/total/requests'
    }),
};

class Sevici {
    constructor(key) {
        this.apiKey = key;
    }
    async searchStation(query) {
        metrics.seviciCallsSec.mark();
        metrics.seviciCallsTotal.inc();
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

        const orderedStations = geolib.orderByDistance(
            query.target.coordinates,
            stations,
            (point, station) => geolib.getDistance(point, station.position)
        );
        if (query.closest) return orderedStations[0];
        return orderedStations[orderedStations.length - 1];

    }
    async searchStations(query) {
        metrics.seviciCallsSec.mark();
        metrics.seviciCallsTotal.inc();
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
    async getStationByID(stationNumber) {
        try {
            metrics.seviciCallsSec.mark();
            metrics.seviciCallsTotal.inc();
            let { data:station } = await axios.get(`https://api.jcdecaux.com/vls/v1/stations/${stationNumber}`, {
                params: {
                    apiKey: this.apiKey,
                    contract: 'seville'
                }
            });
            return station;
        } catch (e) {
            console.error(e);
        }

    }

}

module.exports = new Sevici(process.env.JCDECAUXAPIKEY);
