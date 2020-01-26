const Firestore = require('@google-cloud/firestore');

class Database {

    constructor () {
        this.db = new Firestore();
    }
    async getCredentials() {
        if (this.credentials) return this.credentials;
        if (this.reading) return this.reading;
        // I create this promise that is saved at a class level. That way I don't make multiple calls to the DB if I call it at the same time
        this.reading = new Promise(async (resolve) => {
            let doc = await this.db.collection('keys').doc('production').get();
            if (!doc.exists) throw new Error ('Production keys not found in firestore');
            console.debug('Credentials read from firestore');
            this.credentials = doc.data();
            resolve(this.credentials);
        });
        await this.reading;
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
