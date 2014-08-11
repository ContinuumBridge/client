
// Set up the TCP socket for the bridge
var net = require('net')
    ,Bacon = require('baconjs').Bacon
    ;

var logger = require('../logger')
    ,Message = require('../message')
    ,MessageUtils = require('../message_utils')
    ;

/* Client socket manager */

function ClientSocket(port) {

    var self = this;

    //var clientSocket = {};
    // Connection status flag
    this.connected = false;

    var fromClient = this.fromClient =  new Bacon.Bus();
    var toClient = this.toClient = new Bacon.Bus();

    this.server = net.createServer(function(socket) {

        socket.setEncoding('utf8');

        logger.info('Connected to Client');

        toClient.onValue(function(message) {

            var jsonMessage = message.getJSON();
            socket.write(jsonMessage + '\r\n');
        });

        socket.on('data', function(jsonMessage) {

            var message = new Message(jsonMessage);
            fromClient.push(message);
        }); 

        // Add a 'close' event handler for the bridgeTCPClient socket
        socket.on('close', function() {

            logger.info('Disconnected from Client');
        }); 

        self.socket = socket;

    }).listen(port);

    /*
    this.server.listen(port, function() {
        logger.info('Listening for Client on port', port);
    });
    */
}

module.exports = ClientSocket;

