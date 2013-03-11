var request = require('request');
var q = require('q');

var TRAVIS_API_URL_BASE = 'https://api.travis-ci.org';

var generateAuthenticatedHeaders = function (access_token) {
    var headers = {
        'Accept': 'application/vnd.travis-ci.2+json, */*; q=0.01'
    };
    if (access_token) {
        headers.Authorization = 'token ' + access_token;
    }
    return headers;
};

var TravisApi = function () {

};
TravisApi.prototype.get = function (path, qs) {
    var defer = q.defer();
    request.get({
        url: TRAVIS_API_URL_BASE + path,
        qs: qs,
        headers: generateAuthenticatedHeaders(this.access_token)
    }, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            defer.reject();
        } else {
            defer.resolve(JSON.parse(body));
        }
    });
    return defer.promise;
};

TravisApi.prototype.post = function (path, form) {
    var defer = q.defer();
    request.post({
        url: TRAVIS_API_URL_BASE + path,
        form: form,
        headers: generateAuthenticatedHeaders(this.access_token)
    }, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            defer.reject();
        } else {
            defer.resolve(JSON.parse(body));
        }
    });
    return defer.promise;
};
TravisApi.prototype.put = function (path, json) {
    var defer = q.defer();
    request.put({
        url: TRAVIS_API_URL_BASE + path,
        json: json,
        headers: generateAuthenticatedHeaders(this.access_token)
    }, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            defer.reject();
        } else {
            defer.resolve(body);
        }
    });
    return defer.promise;
};

TravisApi.prototype.authorize = function (access_token) {
    this.access_token = access_token;
};

module.exports = TravisApi;
