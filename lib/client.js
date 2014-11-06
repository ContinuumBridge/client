
require('./config');

var _ = require('underscore');

var retry = require('retry')
    ,util = require('util');

var CBSocketWrapper = require('./cbSocket/socket.js')
    ,controllerAuth = require('./cbSocket/auth.js')
    ,Message = require('./message')
    ;

var logger = require('./logger');

/* Establishes and maintains web socket connection to Continuum Bridge servers */

var Client = function(options) {

    var self = this;

    console.log('options are', options);

    this.connected = false;

    this.config = this.getConfig(options);

    this.cbSocketWrapper = new CBSocketWrapper(this.config);

    this.cbSocketWrapper.on('connect', function(message) {
        self.connected = true;
        self.emit('connect');
        logger.log('debug', 'Client connect');
    });

    this.cbSocketWrapper.on('disconnect', function(message) {
        self.connected = false;
        self.emit('disconnect');
    });

    this.cbSocketWrapper.on('message', function(message) {

        self.emit('message', message);

        var source = message.get('source');
        self.emit(source, message);
        //logger.info('CB => Client: ', message)
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

Client.prototype.getConfig = function(options) {

    var config = {};
    if (options.bridge) {
        config.cbAPI = "http://" + CONTROLLER_API + "/api/bridge/v1/";
        config.cbSocket = "http://" + CONTROLLER_SOCKET + ":9416/";
    } else {
        config.cbAPI = "http://" + CONTROLLER_API + "/api/client/v1/";
        config.cbSocket = "http://" + CONTROLLER_SOCKET + ":7521/";
    }
    if (!options.key) {
        logger.error('No key was provided');
    }
    config.key = options.key;
    config.bridge = options.bridge || false;

    return config;
    //var cbSocketIP = options.cbSocket || CONTROLLER_SOCKET;
}

Client.prototype.connect = function() {

    var self = this;
    var config = this.config;

    this.faultTolerantAuth.attempt(function(currentAttempt) {

        var controllerAuthURL = config.bridge ? config.cbAPI + 'bridge_auth/login/'
            : config.cbAPI + 'client_auth/login/';

        console.log('controllerAuthURL ', controllerAuthURL );
        console.log('config.key', config.key);

        controllerAuth(controllerAuthURL, config.key).then(function(authData) {

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

    if (this.cbSocketWrapper.socket) {
        var jsonMessage = message instanceof Message ? message.toJSONString() : message;
        this.cbSocketWrapper.socket.emit('message', jsonMessage);
    }
}

module.exports = Client;