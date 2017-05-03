/**
 * This is a basic Express server.  We'll build in this class in future 
 * modules.
 * @class
 */
class Server {
    constructor() {
        this.express = require('express');
        this.app = this.express();
        this.setupRoutes();
        this.startServer();
    }

    /**
     * Sets up the necessary routing.
     */
    setupRoutes() {
        this.setupStaticRoutes();
    }

    /**
     * Creates the static routes.
     */
    setupStaticRoutes() {
        this.app.use(this.express.static(__dirname + '/'));
    }

    /**
     * Starts an Express.js server.  If port 3000 is not open, throws an error.
     * @return {Promise} A promise that resolves when the server is up, throws
     * if port 3000 is occupied or some other error occurs.
     */
    startServer() {
        return new Promise((resolve, reject) => {
            try {
                this.app.listen(3000, function() {
                    console.info('Server listening on port 3000');
                    resolve();
                });
            } catch(e) {
                console.warn()
                reject(e);
            }
        });n
    }
}

module.exports = Server;