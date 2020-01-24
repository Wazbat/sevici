const Firestore = require('@google-cloud/firestore');
/*
// Maybe I don't need settings if it's AppEngine?
const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: '/path/to/keyfile.json',
});
*/



class Database {

    constructor () {
        console.log('New DB instance');
        this.db = new Firestore();
    }
    async getCredentials() {
        if (this.credentials) return this.credentials;
        let doc = await this.db.collection('keys').doc('production').get();
        if (!doc.exists) throw new Error ('Production keys not found in firestore');
        this.credentials = doc.data();
        return this.credentials;
    }

    addUser(userID, userObj) {
        const docRef = this.db.collection('users').doc(userID);
        let setData = docRef.set(userObj);
    }
    async getUser(userID) {
        const userDoc = await this.db.collection('users').doc(userID).get();
        if (!userDoc.exists) return {error: `User ${userID} not found`};
        return userDoc.data();

    }

}

module.exports = new Database();
