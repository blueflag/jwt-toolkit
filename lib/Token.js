'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @module Token
 */

/**
 * Tests if the token is valid.
 *
 * @example
 *
 * import Token from 'jwt-toolkit';
 * Token.isValid("NOT A TOKEN");
 * // returns false
 *
 * @param {string} token - JWT string
 * @returns {boolean} A boolean indicating if the token is valid (true) or not (false)
 */

function isValid(token) {
    try {
        (0, _jwtDecode2.default)(token);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Tests if the token is expired according to the client's clock.
 * Be careful with this one, as it can be incorrect if you don't compensate for possible differences between the client's clock and the server's.
 *
 * @example
 *
 * import Token from 'jwt-toolkit';
 * Token.isExpired("eyJhbGciOiJIU...");
 *
 * @param {string} token - JWT string
 * @returns {boolean} A boolean indicating if the token is expired / invalid (true) or has time remaining (false)
 */

function isExpired(token) {
    try {
        var decoded = (0, _jwtDecode2.default)(token);
        var time = Math.floor(new Date().getTime() / 1000);
        return decoded.exp < time;
    } catch (e) {
        return true;
    }
}

/**
 * Returns an object containing JWT as authorization headers.
 *
 * @example
 *
 * import Token from 'jwt-toolkit';
 * Token.asHeaders("eyJhbGciOiJIU...");
 * // returns { Authorization: 'Bearer eyJhbGciOiJIU...' }
 *
 * @param {string} token - JWT string
 * @returns {Object} Headers object with JWT as authorization header
 */

function asHeaders(token) {
    return {
        Authorization: 'Bearer ' + token
    };
}

exports.default = {
    isValid: isValid,
    isExpired: isExpired,
    asHeaders: asHeaders
};