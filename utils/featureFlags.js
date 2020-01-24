const databaseService = require('./database');
const configcat = require('configcat-node');
class FeatureFlagService {

    constructor() {

        // I wish I could just store credentials in an env variable and be done with it ;_;
        this.ready = new Promise((resolve, reject) => {
            try {
                databaseService.getCredentials().then(credentials => {
                    this.configCatClient = configcat.createClient(credentials.CONFIGCAT);
                    resolve();
                });
            } catch (e) {
                reject(e);
                throw e;
            }
        });


    }

    async getValue(key, defaultValue, userObject = null) {
        return this.configCatClient.getValueAsync(key,  defaultValue, userObject)
    }

}

module.exports = new FeatureFlagService();
