
const { Suggestions } = require('actions-on-google');
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.ask('Welcome to Sevici Helper. What can I help you with today?');
        conv.ask(new Suggestions(['Closest available bike', 'Closest available parking space']));
        agent.add(conv);
    } else {
        throw new Error('No actions on google in actions on google welcome handler')
    }
};
