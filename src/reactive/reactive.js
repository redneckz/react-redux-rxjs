import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {
    isFunction,
    isObject,
    isSame,
    createActionsObservable,
    reactiveWrapper
} from '../utils';

export function reactive(
    propsMapper = props$ => props$,
    actionsMapper = () => Observable.empty()
) {
    if (isObject(propsMapper)) {
        const actionsDefinitions = propsMapper;
        return reactive(undefined, actionsDefinitions);
    }
    if (isObject(actionsMapper)) {
        const actionsDefinitions = actionsMapper;
        return reactive(propsMapper, () => actionsDefinitions);
    }
    if (!isFunction(propsMapper)) {
        throw new TypeError('[propsMapper] should be a function');
    }
    if (!isFunction(actionsMapper)) {
        throw new TypeError('[actionsMapper] should be a function');
    }

    return reactiveWrapper(() => (rawProps$) => {
        const props$ = rawProps$.distinctUntilChanged(isSame);
        const mappedProps$ = propsMapper(props$).filter(isObject);
        const combinedProps$ = Observable.combineLatest(
            props$, mappedProps$,
            (props, mappedProps) => Object.assign({}, props, mappedProps)
        ).distinctUntilChanged(isSame);
        const mappedActions$ = createActionsObservable(
            actionsMapper(combinedProps$)
        ).filter(isObject);
        return Observable.merge(combinedProps$, mappedActions$);
    });
}
