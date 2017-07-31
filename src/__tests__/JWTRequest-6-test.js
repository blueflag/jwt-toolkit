import test from 'ava';
import sinon from 'sinon';
import JWTRequest from '../JWTRequest';

test('jwt request will reject the original promise if the request with a renewed token also requires a new token, so it doesnt get stuck in a loop', (tt) => {
    const fakeRequest: Function = sinon.spy();
    const fakeRenew: Function = sinon.spy();

    const requestFunction: Function = (jwt: string): Promise<*> => {
        fakeRequest(jwt);
        // by default errors with status 401 indicate that the token has expired
        /// do this every time
        return new Promise((resolve, reject) => reject({status: 401}));
    };

    const renewTokenFunction: Function = (err: *): ?Promise<string> => {
        if(err && err.status == 401) {
            fakeRenew();
            return new Promise((resolve) => resolve("new jwt"));
        }
    };
    
    const requestPromise: Promise<*> = JWTRequest(requestFunction, renewTokenFunction, "original jwt");

    tt.throws(requestPromise, (err) => err.status == 401, 'jwt request returns the rejected promise');
        
    requestPromise.then(() => {}, () => {
        tt.is(fakeRequest.callCount, 2, 'request is made twice');
        tt.true(fakeRenew.calledOnce, 'renew is called once');
    });

});