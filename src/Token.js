// @flow

import JWTDecode from 'jwt-decode';

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

function isValid(token: string): boolean {
    try {
        JWTDecode(token);
    } catch(e) {
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

function isExpired(token: string): boolean {
    try {
        const decoded: Object = JWTDecode(token);
        const time: number = Math.floor((new Date).getTime() / 1000);
        return decoded.exp < time;
    } catch(e) {
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

function asHeaders(token: string): Object {
    return {
        Authorization: `Bearer ${token}`
    };
}

export default {
    isValid,
    isExpired,
    asHeaders
}
