// @flow

import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request does try-fail-renew-retry with multiple queries all waiting for a single token renewal 🐰🐰🐰', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRequest2: Function = sinon.spy();
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

    const requestFunction2: Function = (jwt: string): Promise<*> => {
        fakeRequest2(jwt);
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
            // add small delay to token renewal response, so the second JWTRequest is fired before this completes, forcing it to wait
            return new Promise((resolve) => setTimeout(() => resolve("new jwt"), 100));
        }
        return null;
    };

    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "original jwt");
    const requestPromise2: Promise<*> = JWTRequest(requestFunction2, renewTokenFunction, "original jwt");

    tt.notThrows(requestPromise, 'request #1: jwt request returns a successful promise');
    requestPromise.then((response) => {
        tt.is(fakeRequest.callCount, 2, 'request #1 is made twice');
        tt.is(fakeRequest.getCall(0).args[0], "original jwt", 'request #1 has jwt of "original jwt"');
        tt.is(fakeRequest.getCall(1).args[0], "new jwt", 'request #1 has jwt of "new jwt"');
        tt.true(fakeRenew.calledOnce, 'renew is called only once - this is the crux of this test!');
        tt.is(response, "response fish 🐟🐟🐟", 'request #1 promise has correct payload');
    });

    tt.notThrows(requestPromise2, 'request #2: jwt request returns a successful promise');
    requestPromise2.then((response) => {
        tt.is(fakeRequest.callCount, 2, 'request #2 is made twice');
        tt.is(fakeRequest.getCall(0).args[0], "original jwt", 'request #2 has jwt of "original jwt"');
        tt.is(fakeRequest.getCall(1).args[0], "new jwt", 'request #2 has jwt of "new jwt"');
        tt.is(response, "response fish 🐟🐟🐟", 'request #2 promise has correct payload');
    });
});