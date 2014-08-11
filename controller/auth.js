
var rest = require('restler'),
    _ = require('underscore'),
    Q = require('q');

var cookie_reader = require('cookie');

/* Controller Authentication */

var controllerAuth = function(controllerURL, email, password) {

    var deferredSessionData = Q.defer();

    var authDetailsObj = {
        "email": email,
        "password": password
    }
    var authDetails = JSON.stringify(authDetailsObj);

    // Define options for Django REST Client
    var controllerAuthOptions = { 
        method: "post",
        headers: {
            'Content-type': 'application/json', 
            'Accept': 'application/json'
        },
        data: authDetails
    };  

    controllerAuthURL = controllerURL + 'client_auth/login/'

    console.log('controllerAuthURL are', controllerAuthURL);

    // Make a request to Django to get session data
    rest.post(controllerAuthURL, controllerAuthOptions).on('complete', function(data, response) {

        // If the response was good, return the session data
        if (response && response.hasOwnProperty('statusCode')) { 
            if (response.statusCode == 200) {
                console.log('Response headers are', response.headers['set-cookie']);
                _.forEach(response.headers['set-cookie'], function(rawCookie) {

                    var cookie = cookie_reader.parse(String(rawCookie));
                    console.log('Cookie is', cookie);
                    if (cookie['sessionid']) deferredSessionData.resolve(cookie['sessionid']);
                });
                //var cookies = cookieParser.JSONCookies(String(response.headers['set-cookie']));
                //deferredSessionData.resolve(cookies);
                //console.log('Cookies are is', cookies);
            } else {
                deferredSessionData.reject('Error from Controller', response, data);
            }
        } else {
            deferredSessionData.reject('There was an error authenticating to the Controller');
        }   
    });

    return deferredSessionData.promise;
}

module.exports = controllerAuth;

