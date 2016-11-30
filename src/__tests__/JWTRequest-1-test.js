// @flow

import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request calls request function and handles success correctly 👍👍👍', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRenew: Function = sinon.spy();

    const requestFunction: Function = (jwt: string): Promise<*> => {
        fakeRequest(jwt);
        // pretend this request has succeeded
        return new Promise((resolve) => resolve("response fish 🐟🐟🐟"));
    };

    const renewTokenFunction: Function = (err: *): ?Promise<string> => {
        if(err && err.status == 401) {
            fakeRenew();
            return new Promise((resolve) => resolve("new jwt"));
        }
        return null;
    };

    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "(im a jwt unicorn!)>🦄");
    tt.notThrows(requestPromise, 'jwt request returns a successful promise');
        
    requestPromise.then((response) => {
        tt.true(fakeRequest.calledOnce, 'request is made once');
        tt.is(fakeRequest.getCall(0).args[0], "(im a jwt unicorn!)>🦄", 'request contains jwt');
        tt.false(fakeRenew.called, 'renew is not called');
        tt.is(response, "response fish 🐟🐟🐟", 'promise has correct payload');
    });
});