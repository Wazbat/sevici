const { BasicCard, Button, Image }  = require("actions-on-google");
const { buildStationString } = require("../../utils");
const { getDirection } = require("../../utils");
const geolib = require('geolib');
const Sevici = require('../../sevici');
const seviciService = new Sevici(process.env.JCDECAUXAPIKEY);
const buildUrl = require('build-url');
const { humanizeStationName } = require("../../utils");
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
        const user = conv.user;
        /*
        console.log('Previous event', conv.data.event);
        conv.followup(conv.data.event, {
            coordinates: location.coordinates,
            ...conv.data.originalParams
        });

         */
        if (!location) return conv.ask(`I'm sorry. I need to access your precise location to be able to search for stations. Is there anything else I can help you with?`);
        const query = conv.data.filter;
        query.coordinates = location.coordinates;
        const station = await seviciService.searchStation(query);
        const distance = geolib.getDistance(location.coordinates, station.position);
        const direction = getDirection(location.coordinates, station.position);

        const humanizedName = humanizeStationName(station.name);

        const textMessage = buildStationString(humanizedName, distance, direction, query);
        conv.ask(textMessage);
        conv.ask(new BasicCard({
            text: `Distance: **${distance} meters**  \n
                Available bikes: **${station.available_bikes}**  \n
                Available stands: **${station.available_bike_stands}**  \n
                Total stands: **${station.bike_stands}**  \n
                Address: **${station.address}**  \n
                Status: **${station.status}**  \n
                Query: **${conv.data.originalParams.criteria.join(' ')}**
                `,
            // subtitle: 'This is a subtitle',
            title: humanizedName,
            buttons: [
                new Button({
                    title: 'View on map',
                    url: buildUrl('https://www.google.com/maps/dir/', {
                        queryParams: {
                            api: 1,
                            destination: `${station.position.lat},${station.position.lng}`
                        }
                    })
                })
            ],
            image: new Image({
                url: buildUrl('https://maps.googleapis.com/maps/api/staticmap', {
                    queryParams: {
                        markers: `${station.position.lat},${station.position.lng}`,
                        size: `700x300`,
                        key: process.env.STATICMAPAPIKEY
                    }
                }),
                alt: 'dock location',
            }),
            display: 'CROPPED',
        }));
        conv.contexts.set('station', 5, station);
}
