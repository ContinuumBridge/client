
require('./config');

var _ = require('underscore');

var retry = require('retry')
    ,util = require('util');

var CBSocketWrapper = require('./cbSocket/socket.js')
    ,controllerAuth = require('./cbSocket/auth.js')
    ,Message = require('./message')
    ;

var logger = require('./logger');

/* Node concentrator for managing socket communication between Client and the main server (Controller) */

var Client = function(options) {

    var self = this;

    this.connected = false;

    this.config = _.defaults(options, {
        cbSocket: CONTROLLER_SOCKET,
        cbAPI: CONTROLLER_API
    });

    this.cbSocketWrapper = new CBSocketWrapper(this.config);

    this.cbSocketWrapper.on('connect', function(message) {
        self.connected = true;
    });

    this.cbSocketWrapper.on('disconnect', function(message) {
        self.connected = false;
    });

    this.cbSocketWrapper.on('message', function(message) {

        self.emit('message', message);

        var source = message.get('source');
        self.emit(source, message);
        logger.info('CB => Client: ', message)
    });

    // Restart connection process on 'giveUp'
    this.cbSocketWrapper.on('fail', function() {
        self.cbSocketWrapper.giveUp();
        self.connect();
    });

    this.faultTolerantAuth = retry.operation()

    this.connect();
}

var EventEmitter = require('events').EventEmitter;
util.inherits(Client, EventEmitter);

Client.prototype.connect = function() {

    var self = this;
    var config = this.config;

    console.log('config is', config);

    this.faultTolerantAuth.attempt(function(currentAttempt) {

        controllerAuth(config.cbAPI, config.key).then(function(authData) {

            logger.info('Authenticated to Client Controller');
            self.setConfig(authData);
            self.cbSocketWrapper.connect(authData.sessionID);

        }, function(error) {

            logger.error(error);
            self.faultTolerantAuth.retry(error);
            logger.info('Retrying..');
            // Authorise again after backoff
        })
    });
}

Client.prototype.setConfig = function(authData) {

    this.cbid = authData.cbid;
}

Client.prototype.publish = function(message) {

    var jsonMessage = message instanceof Message ? message.toJSONString() : message;
    this.cbSocketWrapper.socket.emit('message', jsonMessage);
}

module.exports = Client;