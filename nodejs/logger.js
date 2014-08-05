
var winston = require('winston')
    ,path = require('path')
    ;

// Define logsDir here so that we don't get circular dependencies loading ./env
var logsDir = path.normalize(__dirname + '/../..');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ json: false, timestamp: true, level: 'debug' }),
    new winston.transports.File({ filename: logsDir + "/node-debug.log", json: false, level: 'info' })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: logsDir + "/node-exceptions.log", json: false })
  ],
  exitOnError: false
});

module.exports = logger;