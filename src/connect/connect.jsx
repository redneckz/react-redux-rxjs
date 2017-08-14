import React from 'react';
import * as ReactRedux from 'react-redux';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import assign from 'lodash/assign';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {isSame, createActionsObservable} from '../utils';
import {tapDispatchOperator} from './tap-dispatch-operator';
import {Config} from '../config';

const STORE_STATE = '@@react-redux-rxjs/store-state';

export function connect(
    stateToPropsMapper = (storeState$, props$) => props$,
    dispatchToActionsMapper = () => Observable.empty()
) {
    if (isPlainObject(stateToPropsMapper)) {
        const actionsDefinitions = stateToPropsMapper;
        return connect(undefined, actionsDefinitions);
    }
    if (isPlainObject(dispatchToActionsMapper)) {
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
    )(class ReactiveConnectWrapper extends Config.COMPONENT_BASE_CLASS {
        static displayName = `ReactiveConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

        static internals = {WrappedComponent, stateToPropsMapper, dispatchToActionsMapper};

        constructor(props) {
            super(props);
            this.state = extractComponentProps(props);
            this.propsSubject = new BehaviorSubject(props);
        }

        componentWillMount() {
            const storeState$ = this.propsSubject
                .pluck(STORE_STATE)
                .distinctUntilChanged();
            const props$ = this.propsSubject
                .map(extractComponentProps)
                .distinctUntilChanged(isSame);
            const mappedState$ = stateToPropsMapper(storeState$, props$)
                .filter(isPlainObject);
            const combinedProps$ = Observable.combineLatest(
                props$, mappedState$,
                (props, mappedState) => assign({}, props, mappedState)
            ).distinctUntilChanged(isSame);
            const mappedActions$ = createActionsObservable(
                dispatchToActionsMapper(
                    tapDispatchOperator(this.props.dispatch),
                    combinedProps$
                )
            ).filter(isPlainObject);
            const newProps$ = Observable.merge(combinedProps$, mappedActions$);
            this.subscription = newProps$.subscribe(newProps => this.setState(newProps));
        }

        componentWillUnmount() {
            this.subscription.unsubscribe();
        }

        componentWillReceiveProps(nextProps) {
            this.propsSubject.next(nextProps);
        }

        render() {
            return (
                <WrappedComponent {...this.state}>
                    {this.props.children}
                </WrappedComponent>
            );
        }
    });
}

function extractComponentProps(props) {
    return omit(props, [STORE_STATE, 'dispatch']);
}

function dispatchedActionCreatorMapper(dispatch) {
    return action => arg$ => action(arg$).do(dispatch).ignoreElements();
}
