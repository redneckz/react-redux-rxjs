import isFunction from 'lodash/isFunction';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/distinctUntilChanged';

const DEFAULT_PARENT_SELECTOR = state$ => state$;

export function selector(
    parentSelectors = [DEFAULT_PARENT_SELECTOR],
    stateMapper,
    comparer
) {
    if (isFunction(parentSelectors)) {
        return selector(undefined, parentSelectors, comparer);
    }
    if (!isFunction(stateMapper)) {
        throw new TypeError('[stateMapper] should be a function');
    }
    return (state$) => {
        const args$ = parentSelectors.map(parent => parent(state$));
        return Observable.combineLatest(...args$)
            .map(args => stateMapper(...args))
            .distinctUntilChanged(undefined, comparer);
    };
}
