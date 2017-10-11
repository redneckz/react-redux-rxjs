import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import {tapDispatchOperator} from './tap-dispatch-operator';

describe('tapDispatchOperator', () => {
    const DO_FOO = 'DO_FOO';
    const doFoo = payload => ({type: DO_FOO, payload});

    let originalDispatch;
    let dispatch;
    beforeEach(() => {
        originalDispatch = jest.fn(v => v);
        dispatch = tapDispatchOperator(originalDispatch);
    });

    describe('out of context works as original [dispatch]', () => {
        it('should invoke original [dispatch] with provided action', () => {
            dispatch(doFoo(123));
            expect(originalDispatch).toHaveBeenCalledTimes(1);
            expect(originalDispatch).toHaveBeenCalledWith(doFoo(123));
        });

        it('should return provided action', () => {
            expect(dispatch(doFoo(123))).toEqual(doFoo(123));
        });
    });

    describe('as Observable operator', () => {
        let foo$;
        beforeEach(() => {
            foo$ = Observable.of(123);
        });

        it('should dispatch values from Observable as actions', (done) => {
            foo$.map(doFoo)::dispatch().subscribe(() => {
                expect(originalDispatch).toHaveBeenCalledTimes(1);
                expect(originalDispatch).toHaveBeenCalledWith(doFoo(123));
                done();
            });
        });

        it('should dispatch values from Observable as actions using provided [actionCreator]', (done) => {
            foo$::dispatch(doFoo).subscribe(() => {
                expect(originalDispatch).toHaveBeenCalledTimes(1);
                expect(originalDispatch).toHaveBeenCalledWith(doFoo(123));
                done();
            });
        });

        it('should support Observable of action creators invoking each before dispatching', (done) => {
            Observable.of(() => doFoo(123))
                ::dispatch()
                .subscribe(() => {
                    expect(originalDispatch).toHaveBeenCalledTimes(1);
                    expect(originalDispatch).toHaveBeenCalledWith(doFoo(123));
                    done();
                });
        });
    });
});
