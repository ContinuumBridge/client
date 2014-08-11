
//var getenv = require('getenv')
var path = require('path')
    ,logger = require('./logger')
    ;

var config = require('../client.json');
//logger.log('debug', configJSON);
//var config = JSON.parse(configJSON);

// Get some values from the environment
CONTROLLER_API = "http://" + config.controller_api + "/api/client/v1/";
logger.info('CONTROLLER_API', CONTROLLER_API);

CONTROLLER_SOCKET = "http://" + config.controller_socket + "/";
logger.info('CONTROLLER_SOCKET', CONTROLLER_SOCKET);

CLIENT_EMAIL = config.email;
//getenv('CB_CLIENT_EMAIL', '28b45a59a875478ebcbdf327c18dbfb1@continuumbridge.com');
logger.info('CLIENT_EMAIL', CLIENT_EMAIL);

CLIENT_PASSWORD = config.password;
logger.info('CLIENT_PASSWORD', CLIENT_PASSWORD);

CLIENT_ROOT = path.normalize(__dirname + '/..');
//THIS_CLIENT_ROOT = path.normalize(__dirname + '/../../thisbridge');
