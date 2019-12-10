const { WebhookClient} = require('dialogflow-fulfillment');
const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const https = require('https');
require('dotenv').config();


const app = express();
app.use(express.json());
let intentFunctions = new Map();
intentFunctions.set('app.station.search', require('./intentFunctions/app.station.search'));
intentFunctions.set('aog.permissions.handler', require('./intentFunctions/permissionsHandler'));
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
    let agent;
    try {
        agent = new WebhookClient({request: request, response: response});
    } catch (e) {
        console.error(e);
        response.status(400);
        response.send({
            code: 400,
            message: e.message
        });
    }
    agent.handleRequest(intentFunctions)
        .then(() => {
            console.log('Handled fulfilment request', agent.intent, agent.query)
        })
        .catch(e => {
            console.error(e);
            response.status(400);
            response.send({
                code: 400,
                message: e.message
            });
        });

});
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
}, app).listen(3002, function () {
    console.log('Server running on port 3002');
});
