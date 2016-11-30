// @flow

import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request calls request function and handles generic failure correctly 👎👎👎', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRenew: Function = sinon.spy();

    const requestFunction: Function = (jwt: string): Promise<*> => {
        fakeRequest(jwt);
        // pretend this request has failed
        return new Promise((resolve, reject) => reject(new Error("snakes! oh no! 🐍🐍🐍")));
    };

    const renewTokenFunction: Function = (err: *): ?Promise<string> => {
        if(err && err.status == 401) {
            fakeRenew();
            return new Promise((resolve) => resolve("new jwt"));
        }
        return null;
    };

    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "(im a jwt unicorn!)>🦄");
    tt.throws(requestPromise, "snakes! oh no! 🐍🐍🐍", 'jwt request returns the rejected promise');
        
    requestPromise.then(() => {}, () => {
        tt.true(fakeRequest.calledOnce, 'request is made once');
        tt.is(fakeRequest.getCall(0).args[0], "(im a jwt unicorn!)>🦄", 'request contains jwt');
        tt.false(fakeRenew.called, 'renew is not called');
    });
});