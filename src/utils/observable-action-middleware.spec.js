import isFunction from 'lodash/isFunction';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import {observableActionMiddleware} from './observable-action-middleware';

describe('Observable action middleware', () => {
    let dispatch;
    let nextHandler;

    beforeEach(() => {
        dispatch = jest.fn();
        nextHandler = observableActionMiddleware()({dispatch});
    });

    it('should return a function to handle [next]', () => {
        expect(isFunction(nextHandler)).toBeTruthy();
        expect(nextHandler.length).toBe(1);
    });

    describe('handle next', () => {
        it('should return a function to handle action', () => {
            const actionHandler = nextHandler();
            expect(isFunction(actionHandler)).toBeTruthy();
            expect(actionHandler.length).toBe(1);
        });

        describe('handle action', () => {
            it('should dispatch all actions produced by an [Observable]', () => {
                const actionsList = [
                    {type: 'FOO'},
                    {type: 'BAR'},
                    {type: 'BAZ'}
                ];
                const next = jest.fn();
                const actionHandler = nextHandler(next);
                actionHandler(Observable.of(...actionsList));
                expect(next).not.toBeCalled();
                dispatch.mock.calls.forEach(([action], i) => {
                    expect(action).toBe(actionsList[i]);
                });
            });

            it('should pass action to [next] if not an [Observable]', () => {
                const action = {};
                const next = jest.fn();
                const actionHandler = nextHandler(next);
                actionHandler(action);
                expect(next.mock.calls.length).toBe(1);
                expect(next).toBeCalledWith(action);
            });

            it('should return the resulting value of [next] if not an [Observable]', () => {
                const expected = 'redux';
                const actionHandler = nextHandler(() => expected);
                expect(actionHandler()).toBe(expected);
            });
        });
    });
});
