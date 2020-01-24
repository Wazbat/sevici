require('@google-cloud/debug-agent').start();
const { WebhookClient} = require('dialogflow-fulfillment');
const express = require('express');
require('dotenv').config();
/*
TODO Reimplement metrics using stackdriver
const io = require('@pm2/io');
const metrics = {
    realtimeSessions: io.metric({
        name: 'Realtime Sessions',
        id: 'app/realtime/sessions',
    }),
    requests: io.meter({
        name: 'fulfillmentReqs/sec',
        id: 'app/fulfillment/realtime/requests'
    }),
    errors: io.meter({
        name: 'fulfillmentErrors/sec',
        id: 'app/fulfillment/realtime/errors'
    })
};
 */

const app = express();
app.use(express.json());
let intentFunctions = new Map();
intentFunctions.set('aog.welcome', require('./intentFunctions/aog.welcome'));
intentFunctions.set('app.station.search', require('./intentFunctions/app.station.search'));
intentFunctions.set('aog.permissions.handler', require('./intentFunctions/permissionsHandler'));
intentFunctions.set('app.station.extra.partCount', require('./intentFunctions/app.station.extra.partCount'));
intentFunctions.set('app.station.extra.distance', require('./intentFunctions/app.station.extra.distance'));
intentFunctions.set('app.station.extra.repeat', require('./intentFunctions/app.station.extra.repeat'));
intentFunctions.set('app.parking.search.available', require('./intentFunctions/app.parking.search.available'));
intentFunctions.set('app.bike.search.available', require('./intentFunctions/app.bike.search.available'));
intentFunctions.set('app.station.specific', require('./intentFunctions/app.station.specifc'));
intentFunctions.set('app.routing.search', require('./intentFunctions/app.routing.search'));
intentFunctions.set('Place Handler', (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.ask('Place handler with place');
        console.log('search handled');
        console.log('data', conv.data);
        console.log('intent', conv.intent);
        console.log('parameters', conv.parameters);
        console.log('incoming', conv.incoming)
    } else {
        agent.add('Search handler')
    }

});
app.get('/', (request, response) => {
   response.status(418).send('Fulfillment Online');
});
app.post('/chatbot/fulfillment',  (request, response) => {
    // metrics.requests.mark();
    let agent;
    try {
        agent = new WebhookClient({request: request, response: response});
    } catch (e) {
        // metrics.errors.mark();
        console.error(e);
        response.status(400);
        response.send({
            code: 400,
            message: e.message
        });
    }
    agent.handleRequest(intentFunctions)
        .then(() => {
            console.log(`Handled fulfilment request: ${agent.intent} - ${agent.query}`);
        })
        .catch(e => {
            // metrics.errors.mark();
            console.error(e);
            response.status(400);
            response.send({
                code: 400,
                message: e.message
            });
        });

});

app.set('trust proxy', true);
app.listen(process.env.PORT || 8080, () => {
    console.info(`App running on port ${process.env.PORT || 8080}`)
});


