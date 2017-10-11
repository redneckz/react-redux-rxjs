import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/bufferCount';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/isEmpty';
import {isFunction, isObject} from '../utils';
import {createActionsObservable} from './create-actions-observable';

describe('createActionsObservable', () => {
    const ACTIONS_DEFINITIONS = {
        doFoo: foo$ => foo$.map(foo => ({foo})),
        doBar: bar$ => bar$.map(bar => ({bar})),
        doBaz: baz$ => baz$.map(baz => ({baz}))
    };

    it(
        'should create observable containing action function for each action definition',
        (done) => {
            const actionsObservable = createActionsObservable(ACTIONS_DEFINITIONS);
            expect(actionsObservable).toBeInstanceOf(Observable);
            actionsObservable.first().subscribe((actions) => {
                expect(isObject(actions)).toBeTruthy();
                Object.keys(ACTIONS_DEFINITIONS).forEach((key) => {
                    expect(Object.keys(actions)).toContain(key);
                });
                expect(Object.keys(actions).every(
                    key => isFunction(actions[key])
                )).toBeTruthy();
                done();
            });
        }
    );

    it(
        'should handle each action invocation by means of transducer declared in action definition',
        (done) => {
            const actionsObservable = createActionsObservable(ACTIONS_DEFINITIONS);
            expect(actionsObservable).toBeInstanceOf(Observable);
            actionsObservable.first().delay(0).subscribe((actions) => {
                actions.doFoo(123);
                actions.doBar(456);
                actions.doBaz(789);
            });
            actionsObservable.skip(1).bufferCount(3).subscribe((doFooArgs) => {
                expect(doFooArgs).toEqual([
                    {foo: 123},
                    {bar: 456},
                    {baz: 789}
                ]);
                done();
            });
        }
    );

    it('should silently pass through observables as is (degenerate case)', () => {
        const o = Observable.of({});
        expect(createActionsObservable(o)).toBe(o);
    });

    it('should return empty observable if nil passed (degenerate case)', () => {
        const nullActionsObservable = createActionsObservable(null);
        expect(nullActionsObservable).toBeInstanceOf(Observable);
        expect(nullActionsObservable.isEmpty()).toBeTruthy();
        const undefinedActionsObservable = createActionsObservable(undefined);
        expect(undefinedActionsObservable).toBeInstanceOf(Observable);
        expect(undefinedActionsObservable.isEmpty()).toBeTruthy();
    });

    it('should fail if passed something other than plain object or observable', () => {
        expect(() => createActionsObservable('123')).toThrowError(TypeError);
        expect(() => createActionsObservable(123)).toThrowError(TypeError);
        expect(() => createActionsObservable(true)).toThrowError(TypeError);
        expect(() => createActionsObservable(false)).toThrowError(TypeError);
        expect(() => createActionsObservable(/\d+/)).toThrowError(TypeError);
    });
});
