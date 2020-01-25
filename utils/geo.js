const moment = require('moment');
const _ = require('lodash');
const db = require('./database');
const featureFlagService = require('./featureFlags');
const gmaps = require('@google/maps');

const seviciService = require('./sevici');
const geolib = require('geolib');

const stringService = require("./locale");


class GeoService {
    constructor() {
        // Allowed in https://cloud.google.com/maps-platform/terms/maps-service-terms/ Point 3.4
        this.geoCache = new Map();
        this.directionsCache = new Map();
        this.ready = new Promise((resolve, reject) => {
            try {
                db.getCredentials().then(credentials => {
                    this.googleMapsClient = gmaps.createClient({
                        key: credentials.GOOGLEMAPS,
                        Promise: Promise
                    });
                });
                resolve();
            } catch (e) {
                reject(e);
                throw e;
            }
        });
    }
    /**
     *
      * @param location
     * @param locale
     * @param sessionID
     * @returns {Promise<{error: string}|{distance: *, error: string}|any|{name: *, coordinates: *, cachedUses: number, timestamp: *}>}
     */
    async getGeoCodePlace(location, locale, sessionID = null) {
        await this.ready;
        let userObject;
        if (sessionID) {
            userObject = {
                identifier: sessionID,
                country: stringService.getLocale(locale) || null
            }
        }
        const allowed = await featureFlagService.getValue('geocodingApiGlobal',  false, userObject);
        if (!allowed) return {error: 'FEATURE_NOT_ENABLED_GEOCODING'};
        /*
        let query = '';
        if (location['business-name']) query += location['business-name'];
        if (location['street-address']) query += ` ${location['street-address']}`;
         */

        let query = '';
        if (typeof location === 'string') {
            query = location.trim().toLowerCase()
        } else if (typeof location === 'object' && location !== null) {
            // Get the values of the location object, filter out falsy empty ones, then join them with commas
            query = Object.values(location).filter(val => val).join(', ');
            query = query.trim().toLowerCase();
            if (!query) {
                console.error('Empty location');
                return { error: 'EMPTY_SEARCH_GEO'};
            }
        } else {
            throw new TypeError('Invalid location type in geo search. Must be object or string')
        }

        // Return cached query if it's less than a set time ago
        const cached = this.geoCache.get(query);
        if (cached && moment(cached.timestamp).isAfter(moment().subtract(20, 'days'))) {
            /*
            metrics.cachedCallsSec.mark();
            metrics.cachedCallsTotal.inc();
             */
            cached.cachedUses++;
            this.geoCache.set(query, cached);
            console.debug(`Returned cached result for "${query}". Cached uses: ${cached.cachedUses}`);
            return cached;
        }
        /*
        TODO Reimplement metrics using stackdriver metrics
        metrics.geocodingCallsTotal.inc();
        metrics.geocodingCallsSec.mark();
         */
        const response = await this.googleMapsClient.geocode({
            address: query,
            language: 'es',
            // Seville for biasing
            // TODO Reduce bounds
            bounds: {
                north: 37.673415,
                south: 37.077416,
                east: -5.608832,
                west: -6.438637
            },
            region: 'ES'
        }).asPromise();
        console.debug(`Got ${response.json.results.length} geocoding results for: ${query}`);
        if (response.json.results.length) {
            // Check how far the result is from the center of seville
            const distanceFromSeville = geolib.getDistance(response.json.results[0].geometry.location, {lat: 37.387402, lng: -5.987744});
            if (distanceFromSeville > 20000) return { error: 'RESULT_TOO_FAR', distance : distanceFromSeville};
            const res = {
                // TODO Extract name properly
                // name: response.json.results[0]['address_components'][0]['short_name'],
                name: _.capitalize(query),
                coordinates: response.json.results[0].geometry.location,
                timestamp: new Date().getTime(),
                cachedUses: 0
            };
            this.geoCache.set(query, res);
            return res;
        }
        return { error: 'NO_RESULTS_GEO'}
    }

    async getDirections(start, end, locale, sessionID = null, travelTime = false) {
        await this.ready;
        let userObject;
        if (sessionID) {
            userObject = {
                identifier: sessionID,
                country: stringService.getLocale(locale) || null
            }
        }
        const [departureStation, destinationStation] = await Promise.all([
            seviciService.searchStation({
                target: {
                    coordinates: start
                },
                freeBikes: true,
                status: 'OPEN'
            }),
            seviciService.searchStation({
                target: {
                    coordinates: end
                },
                freeParking: true,
                status: 'OPEN'
            })
        ]);
        if (!departureStation || !destinationStation) return { error: 'NO_STATION_RESULTS' };
        const key = JSON.stringify({start, end});
        const cached = this.directionsCache.get(key);
        if (cached) {
            cached.cachedUses++;
            this.directionsCache.set(key, cached);
            console.debug('Returning cached directions for route');
            return cached;
        }
        let matrix;
        // TODO Implement user objects for user targeting
        if (travelTime && await featureFlagService.getValue('navigationApiGlobal',  false, userObject)) {
            const query = {
                origin: departureStation.position,
                destination: destinationStation.position,
                mode: 'bicycling',
                units: 'metric',
                language: stringService.getLocale(locale) || 'en',
                timeout: 1500
            };
            const response = await this.googleMapsClient.directions(query).asPromise();
            const result = response.json;
            if (response.status === 200 || true) {
                matrix = {
                    distance: result.routes[0].legs[0].distance.text,
                    duration: result.routes[0].legs[0].duration.text,
                    points: result.routes[0].overview_polyline.points,
                    warnings: result.routes[0].warnings
                }
            }
        }
        const response = {
            departureStation,
            departureStationDistance: geolib.getDistance(start, departureStation.position),
            destinationStation,
            destinationStationDistance: geolib.getDistance(end, destinationStation.position),
            matrix,
            timestamp: new Date().getTime(),
            cachedUses: 0
        };
        this.directionsCache.set(key, response);
        return response;

    }
}

module.exports = new GeoService();
