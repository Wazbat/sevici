const geolib = require('geolib');
module.exports = {
    /**
     * Builds a object with optional properties that are later used to search
     * @param criteria
     * @returns {{closest: boolean, freeBikes?: boolean, freeParking?: boolean}}
     */
    buildFilter(criteria) {
        let query = { closest: true };
        if (criteria.includes('furthest')) query.closest = false;
        if (criteria.includes('with bikes')) query.freeBikes = true;
        if (criteria.includes('without bikes')) query.freeBikes = false;
        if (criteria.includes('with free dock')) query.freeParking = true;
        if (criteria.includes('without free dock')) query.freeParking = false;
        return query;
    },
    /**
     * Returns direction of destination coordinates as a long string.
     * Examples: northwest, eastnortheast, south, northnorthwest
     * @param origin Origin coordinates object
     * @param destination Destination coordinates object
     * @returns {string}
     */
    getDirection(origin, destination) {
        const direction = geolib.getCompassDirection(origin, destination);
        const letters = direction.split('');
        const words = letters.map(letter => {
            if (letter === 'N') return 'north';
            if (letter === 'E') return 'east';
            if (letter === 'S') return 'south';
            if (letter === 'W') return 'west';
        });
        return words.join('');
    },
    /**
     * Builds a response string using the provided data
     * Used when searching for a station
     * @param name
     * @param distance
     * @param direction
     * @param query
     * @returns {string}
     */
    buildStationString(name, distance, direction, query) {
        let string = 'The ';
        string += query.closest ? 'closest' : 'furthest';
        string += ' station from you ';
        if (query.freeBikes) {
            string += 'with free bikes'
        } else if (query.freeBikes === false) {
            string += 'without any available bikes';
        }
        if (query.freeParking) {
            if (query.freeBikes || query.freeBikes === false) string += ' and ';
            string += 'with space to dock';
        } else if (query.freeParking === false) {
            if (query.freeBikes || query.freeBikes === false) string += ' and ';
            string += 'without any space to park';
        }
        let distanceString;
        if (distance > 999) {
            distanceString = `${_.round(distance/1000, 1)} kilometers`
        } else {
            distanceString = `${distance} meters`
        }
        string += ` is ${name}, ${distanceString} away to the ${direction}`;
        return string;
    }
};
