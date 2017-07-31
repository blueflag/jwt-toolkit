"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});


// internally this creates a promise that all requests can chain off
// if its resolved, requests will fire instantly
// if not, it'll fire all chained requests once a valid token has returned
//
// we need this to be a singleton because all requests must know about it (as the token itself is essentially a singleton)
// 
// npm sometimes doesn't successfully merge all usages of a file
// so sometimes there'll be two 'lastTokenPromise' vars depending on which package is calling it
// for this reason we need to keep track of the fetching state in the same place as the promise

var lastTokenPromise = null;
var fetchingNewToken = false;

var MAX_ATTEMPTS = 1;

function renewToken(renewTokenFunction, err) {
    // already fetching a new token? pass back this promise
    // and it'll fire once the new token has arrived
    if (fetchingNewToken && lastTokenPromise) {
        return lastTokenPromise;
    }

    // assign this dispatched action and its 'then' to the lastTokenPromise singleton
    // so other actions can chain off it when it succeeds
    var promise = renewTokenFunction(err);
    if (!promise) {
        return Promise.reject(err);
    }

    var fetchedPromise = promise.then(function (newJwt) {
        // jwt renewed
        fetchingNewToken = false;
        return newJwt;
    });

    fetchingNewToken = true;
    lastTokenPromise = fetchedPromise;
    return fetchedPromise;
}

function makeJWTRequest(requestFunction, renewTokenFunction) {
    var attempts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    // this shouldn't ever happen, but it keeps flow happy
    if (!lastTokenPromise) {
        return new Promise(function (resolve) {
            return resolve();
        });
    }
    return lastTokenPromise.then(function (jwt) {
        // fire actual api function with the jwt provided by lastTokenPromise
        return requestFunction(jwt);
    }).then(undefined, // pass through success
    function (err) {
        if (!err) {
            return Promise.reject();
        }
        if (attempts >= MAX_ATTEMPTS) {
            return Promise.reject(err);
        }
        // ask to possibly get a new token from the server by calling the renew token function, then retry the original query
        return renewToken(renewTokenFunction, err).then(function () {
            return makeJWTRequest(requestFunction, renewTokenFunction, attempts + 1);
        });
    });
}

/**
 * @module JWTRequest
 */

/**
 * JWTRequest is designed to help with trying and retrying XHR requests using JWT.
 * As JWTs can expire without the front-end knowing about it, inevitably requests are sometimes sent with expired JWTs.
 * The back end will often respond with an appropriate error and  status code to indicate that the token has expired.
 * The front-end must then request a new token and retry the original request (or set of requests) with the new token.
 * This function handles that try-fail-renew-retry pattern.
 *
 * It does not make XHR requests itself, it merely provides hooks.
 *
 * Any new responses that arrive while a token is being renewed will be queued and fired once the new token is received.
 *
 * @example
 *
 * const requestFunction: Function = (jwt: string): Promise<*> => {
 *      const headers = Token.asHeaders(jwt);
 *      return coolRequest(headers);
 * };
 *
 * const renewTokenFunction: Function = (err: *): ?Promise<string> => {
 *     // example: in this case the server indicates that your token has expired (and your coolRequest has failed) by returning a 401 error
 *     if(err && err.status == 401) {
 *         return renewMyTokenRequest();
 *     }
 * };
 *
 * JWTRequest(requestFunction, renewTokenFunction, "myTokenStringHere");
 *
 * @param {RequestFunction} requestFunction
 * @param {RenewTokenFunction} renewTokenFunction
 * @param {string} initialJwt The JWT to attempt to use for the initial request.
 * @returns {Promise} A promise that will be resolved once the request is complete, after any necessary renewing and retrying.
 * It will be rejected if the response indicates an error has occured (not counting errors due to expired tokens).
 */

function JWTRequest(requestFunction, renewTokenFunction, initialJwt) {
    // if lastTokenPromise isn't set, create a resolved promise so the current request can fire
    if (!lastTokenPromise) {
        lastTokenPromise = new Promise(function (resolve) {
            return resolve(initialJwt);
        });
    }
    return makeJWTRequest(requestFunction, renewTokenFunction);
}

/**
 * A function that makes the request you want when.
 * It is passed the JWT string to use in your request, and must return a promise that should be resolved / rejected when your request resolves / rejects.
 *
 * @typedef RequestFunction
 * @param {string} jwt The JWT string to use in your request.
 * @return {Promise} A promise that should be resolved / rejected when your request resolves / rejects.
 */

/**
 * A function that is called when a request returns an error. Using the error info provided you can then makes a request to get a new JWT.
 * This function should return a promise containing the new JWT string, or a falsey value if you don't want to renew the token.
 *
 * @typedef RenewTokenFunction
 * @param {*} err The error payload for the original request. Use the info within to determine if you should renew your token.
 * @return {Promise<string>?} A promise that should be resolved / rejected when your new token request resolves / rejects, or a falsey value if you don't want to renew the token.
 */

exports.default = JWTRequest;