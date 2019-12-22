
const handlerMap = new Map();
handlerMap.set('station-search', require("./permissionsHandlerFunctions/station-search").stationSearch);
handlerMap.set('station-distance', require('./permissionsHandlerFunctions/station-distance').stationDistance);
handlerMap.set('station-route', require("./permissionsHandlerFunctions/station-route").routeSearch);
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        if (!handlerMap.has(conv.data.event)) throw new Error(`Search handler with unhandled event: ${conv.data.event}`);
        await handlerMap.get(conv.data.event)(conv);
        agent.add(conv);
    } else {
        throw new Error('No actions on google in permissions handler')
    }
};
