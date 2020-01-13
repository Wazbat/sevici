
const { Suggestions } = require('actions-on-google');
const stringService = require('../utils/locale');
module.exports = async (agent) => {
    const conv = agent.conv();
    if (conv) {
        conv.ask(stringService.getString('welcome to the helper', conv.user.locale));
        conv.ask(new Suggestions([
            stringService.getString('closest available bike', conv.user.locale),
            stringService.getString('closest available dock', conv.user.locale)
        ]));
        agent.add(conv);
    } else {
        throw new Error('No actions on google in actions on google welcome handler')
    }
};
