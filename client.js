
require('./config');

var Bacon = require('baconjs');

var ClientSocket = require('./lib/client/socket.js')
    ,ControllerSocket = require('./lib/controller/socket.js')
    ,controllerAuth = require('./lib/controller/auth.js')
    ,Heartbeat = require('./lib/heartbeat.js')
    ,Message = require('./lib/message')
    ;

var logger = require('./lib/logger');


/* Node concentrator for managing socket communication between Client and the main server (Controller) */

var Client = function(email, password) {

    var clientSocket = new ClientSocket(5000);

    var controllerSocket = new ControllerSocket();

    var heartbeat = new Heartbeat(controllerSocket, clientSocket);
    heartbeat.start();

    controllerSocket.fromController.onValue(function(message) {

        // Take messages from the controller and relay them to the client
        clientSocket.toClient.push(message);
        logger.info('Controller => Client: ', message)
    });

    clientSocket.fromClient.onValue(function(message) {

        // Take messages from the client and relay them to the controller
        controllerSocket.toController.push(message);
        logger.info('Client => Controller: ', message);
    });

    // Send a test message
    var testMessage = new Message({
        destination: 'UID1',
        source: 'CID22'
    });
    var testStream = Bacon.interval(5000, testMessage);
    controllerSocket.toController.plug(testStream);

    connectToController = function() {

        controllerAuth(CONTROLLER_API, CLIENT_EMAIL, CLIENT_PASSWORD).then(function(sessionID) {

            logger.info('Authenticated to Client Controller');
            logger.info('sessionID in auth is', sessionID);

            controllerSocket.connect(CONTROLLER_SOCKET, sessionID);

            //TODO {"msg":"aggregator_status", "data":"ok"}
        }, function(error) {

            logger.error(error);
            logger.info('Retrying..');
            // Authorise again after 8 seconds
            setTimeout(connectToController, 8000);
        });
    };

    connectToController();

    // Restart connection process on 'giveUp'
    controllerSocket.on('giveUp', function() {
        logger.log('debug', 'calling connectToController after giveUp');
        setTimeout(connectToController, 8000);
    });
}
