import * as ReactRedux from 'react-redux';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {
    isFunction,
    isObject,
    isSame,
    mapValues,
    createActionsObservable,
    reactiveWrapper
} from '../utils';
import {tapDispatchOperator} from './tap-dispatch-operator';

const STORE_STATE = '@@react-redux-rxjs/store-state';

export function connect(
    stateToPropsMapper = (storeState$, props$) => props$,
    dispatchToActionsMapper = () => Observable.empty()
) {
    if (isObject(stateToPropsMapper)) {
        const actionsDefinitions = stateToPropsMapper;
        return connect(undefined, actionsDefinitions);
    }
    if (isObject(dispatchToActionsMapper)) {
        const actionsDefinitions = dispatchToActionsMapper;
        return connect(stateToPropsMapper, dispatch => mapValues(
            actionsDefinitions,
            dispatchedActionCreatorMapper(dispatch)
        ));
    }
    if (!isFunction(stateToPropsMapper)) {
        throw new TypeError('[stateToPropsMapper] should be a function');
    }
    if (!isFunction(dispatchToActionsMapper)) {
        throw new TypeError('[dispatchToActionsMapper] should be a function');
    }
    return WrappedComponent => ReactRedux.connect(
        storeState => ({[STORE_STATE]: storeState})
    )(reactiveWrapper(
        propsMapper,
        propsCleaner
    )(WrappedComponent));

    function propsMapper({dispatch}) {
        return (rawProps$) => {
            const storeState$ = rawProps$.pluck(STORE_STATE).distinctUntilChanged();
            const props$ = rawProps$.map(propsCleaner).distinctUntilChanged(isSame);
            const mappedState$ = stateToPropsMapper(
                storeState$,
                props$,
                tapDispatchOperator(dispatch)
            ).filter(isObject);
            const combinedProps$ = Observable.combineLatest(
                props$, mappedState$,
                (props, mappedState) => Object.assign({}, props, mappedState)
            ).distinctUntilChanged(isSame);
            const mappedActions$ = createActionsObservable(
                dispatchToActionsMapper(
                    tapDispatchOperator(dispatch),
                    combinedProps$
                )
            ).filter(isObject);
            return Observable.merge(combinedProps$, mappedActions$);
        };
    }

    function propsCleaner(props) {
        const {[STORE_STATE]: storeState, dispatch, ...rest} = props;
        return rest;
    }
}

function dispatchedActionCreatorMapper(dispatch) {
    return action => arg$ => action(arg$).do(dispatch).ignoreElements();
}
