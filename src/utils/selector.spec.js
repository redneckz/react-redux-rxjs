import zip from 'lodash/zip';
import times from 'lodash/times';
import last from 'lodash/last';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/range';
import 'rxjs/add/operator/bufferCount';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/concatMap';
import {selector} from './selector';

describe('selector', () => {
    const FOO_A = {foo: 'A', bar: {baz: 'A'}};
    const FOO_B = {foo: 'B', bar: {baz: 'B'}};
    const FOO_C = {foo: 'C', bar: {baz: 'C'}};
    const HISTORY = [FOO_A, FOO_B, FOO_C];
    const FOO_HISTORY = HISTORY.map(s => s.foo);
    const BAZ_HISTORY = HISTORY.map(s => s.bar.baz);

    let state$;
    beforeEach(() => {
        state$ = Observable.range(0, HISTORY.length)
            .map(i => HISTORY[i])
            .concatMap(s => [s, s, s]); // duplicate
    });

    it(`should select distinct values by means of provided function
        (consequent duplicates are ignored)`, (done) => {
        const selectFoo = selector(({foo}) => foo);
        selectFoo(state$)::head().subscribe((fooHistory) => {
            expect(fooHistory).toEqual(FOO_HISTORY);
            done();
        });
    });

    it(`should select distinct values by means of provided function
        relative to parent selector`, (done) => {
        const selectBar = selector(({bar = {}}) => bar);
        const selectBaz = selector([selectBar], ({baz}) => baz);
        selectBaz(state$)::head().subscribe((bazHistory) => {
            expect(bazHistory).toEqual(BAZ_HISTORY);
            done();
        });
    });

    it(`should select distinct values by means of provided function
        and several parent selectors`, (done) => {
        const selectFoo = selector(({foo}) => foo);
        const selectBar = selector(({bar = {}}) => bar);
        const selectBaz = selector([selectBar], ({baz}) => baz);
        const selectFooBaz = selector(
            [selectFoo, selectBaz],
            (foo, baz) => [foo, baz]
        );
        selectFooBaz(state$)::head().subscribe((fooBazHistory) => {
            expect(fooBazHistory).toEqual(
                zip(
                    // Cause the last value of foo is already available
                    times(HISTORY.length, () => last(FOO_HISTORY)),
                    BAZ_HISTORY
                )
            );
            done();
        });
    });

    function head(n = HISTORY.length) {
        return this.bufferCount(n).first();
    }
});
