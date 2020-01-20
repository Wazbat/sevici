const { WebhookClient} = require('dialogflow-fulfillment');
const fs = require('fs');
const express = require('express');
const https = require('https');
require('dotenv').config();
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRYDSN });
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

app.post('/chatbot/fulfillment',  (request, response) => {
    metrics.requests.mark();
    let agent;
    try {
        agent = new WebhookClient({request: request, response: response});
    } catch (e) {
        metrics.errors.mark();
        console.error(e);
        Sentry.captureException(e);
        Sentry.withScope(scope => {
            scope.setExtra('requestbody', request.body);
            scope.setLevel('fatal');
            Sentry.captureException(e);
        });
        response.status(400);
        response.send({
            code: 400,
            message: e.message
        });
    }
    Sentry.configureScope(scope => {
        scope.setTag('intent', agent.intent);
        scope.setExtra('intent', agent.intent);
        scope.setExtra('action', agent.action);
        scope.setExtra('parameters', agent.parameters);
        scope.setExtra('contexts', agent.contexts);
        scope.setExtra('context', agent.context);
        scope.setExtra('requestSource', agent.requestSource);
        scope.setExtra('originalRequest', agent.originalRequest);
        scope.setExtra('query', agent.query);
        scope.setExtra('locale', agent.locale);
        scope.setExtra('session', agent.session);
        scope.setExtra('consoleMessages', agent.consoleMessages);
        scope.setExtra('alternativeQueryResults', agent.alternativeQueryResults);
    });
    agent.handleRequest(intentFunctions)
        .then(() => {
            console.log('Handled fulfilment request', agent.intent, agent.query);
        })
        .catch(e => {
            metrics.errors.mark();
            console.error(e);
            Sentry.withScope(scope => {
                scope.setLevel('fatal');
                Sentry.captureException(e);
            });
            response.status(400);
            response.send({
                code: 400,
                message: e.message
            });
        });

});
if (process.env.NODE_ENV !== 'test') {
    let key;
    let cert;
    try {
        key = fs.readFileSync('../httpsKeys/warren.works.key');
        cert= fs.readFileSync('../httpsKeys/warren.works.cert');
    } catch (e) {
        console.error(e);
    }
    https.createServer({
        key: key,
        cert: cert
    }, app).listen(3002, () => {
        console.log('Server running on port 3002');
    });
}

