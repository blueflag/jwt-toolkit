// @flow

import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request will reject the original promise if token renewal fails', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRenew: Function = sinon.spy();

    const requestFunction: Function = (jwt: string): Promise<*> => {
        fakeRequest(jwt);
        // by default errors with status 401 indicate that the token has expired
        return new Promise((resolve, reject) => reject({status: 401}));
    };

    const renewTokenFunction: Function = (err: *): ?Promise<string> => {
        if(err && err.status == 401) {
            fakeRenew();
            // pretend the token renewal has also failed
            return new Promise((resolve, reject) => reject(new Error("snakes! oh no! 🐍🐍🐍")));
        }
        return null;
    };

    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "original jwt");

    tt.throws(requestPromise, "snakes! oh no! 🐍🐍🐍", 'jwt request returns the rejected toekn renewal promise');
        
    requestPromise.then(() => {}, () => {
        tt.true(fakeRequest.calledOnce, 'request is made once');
        tt.true(fakeRenew.calledOnce, 'renew is called once');
    });

});