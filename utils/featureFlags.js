const databaseService = require('./database');

// TODO Migrate to firebase remote config whenever they add support for it
const configcat = require('configcat-node');
class FeatureFlagService {

    constructor() {
        this.ready = new Promise(async (resolve, reject) => {
            try {
                const credentials = await databaseService.getCredentials();
                this.configCatClient = configcat.createClient(credentials.CONFIGCAT);
                resolve();
            } catch (e) {
                reject(e);
                throw e;
            }
        });
    }

     async getValue(key, defaultValue, userObject = null) {
        await this.ready;
        return await this.configCatClient.getValueAsync(key,  defaultValue, userObject)
    }

}

module.exports = new FeatureFlagService();
