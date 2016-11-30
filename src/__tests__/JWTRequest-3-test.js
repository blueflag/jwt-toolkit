// @flow

import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request calls request function and handles token renewal and retry 👍👍👍', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRenew: Function = sinon.spy();

    const requestFunction: Function = (jwt: string): Promise<*> => {
        fakeRequest(jwt);
        // make this request fail with "original jwt", and succeed with "new jwt"
        if(jwt == "new jwt") {
            return new Promise((resolve) => resolve("response fish 🐟🐟🐟"));
        }
        // by default errors with status 401 indicate that the token has expired
        return new Promise((resolve, reject) => reject({status: 401}));
    };

    const renewTokenFunction: Function = (err: *): ?Promise<string> => {
        if(err && err.status == 401) {
            fakeRenew();
            return new Promise((resolve) => resolve("new jwt"));
        }
        return null;
    };

    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "original jwt");

    tt.notThrows(requestPromise, 'jwt request returns a successful promise');
        
    requestPromise.then((response) => {
        tt.is(fakeRequest.callCount, 2, 'request is made twice');
        tt.is(fakeRequest.getCall(0).args[0], "original jwt", 'request #1 has jwt of "original jwt"');
        tt.is(fakeRequest.getCall(1).args[0], "new jwt", 'request #1 has jwt of "new jwt"');
        tt.true(fakeRenew.called, 'renew is called');
        tt.is(response, "response fish 🐟🐟🐟", 'promise has correct payload');
    });
});