import React from 'react';
import * as ReactRedux from 'react-redux';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import omit from 'lodash/omit';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {isSame, createActionsObservable} from '../utils';
import {tapDispatchOperator} from './tap-dispatch-operator';

export function connect(
    stateToPropsMapper = (storeState$, props$) => props$,
    dispatchToActionsMapper = () => Observable.empty()
) {
    if (!isFunction(stateToPropsMapper)) {
        throw new TypeError('[stateToPropsMapper] should be a function');
    }
    if (!isFunction(dispatchToActionsMapper)) {
        throw new TypeError('[dispatchToActionsMapper] should be a function');
    }
    return WrappedComponent => ReactRedux.connect(
        storeState => ({storeState})
    )(class ReactiveConnectWrapper extends React.PureComponent {
        static displayName = `ReactiveConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

        static internals = {WrappedComponent, stateToPropsMapper, dispatchToActionsMapper};

        constructor(props) {
            super(props);
            const initialProps = extractComponentProps(props);
            this.state = initialProps;
            this.storeStateSubject = new BehaviorSubject(props.storeState);
            this.propsSubject = new BehaviorSubject(initialProps);
        }

        componentWillMount() {
            const storeState$ = this.storeStateSubject.distinctUntilChanged();
            const props$ = this.propsSubject.distinctUntilChanged(isSame);
            const mappedState$ = stateToPropsMapper(storeState$, props$)
                .filter(isPlainObject);
            const mappedActions$ = createActionsObservable(
                dispatchToActionsMapper(
                    tapDispatchOperator(this.props.dispatch),
                    mappedState$
                )
            ).filter(isPlainObject);
            const newProps$ = Observable.merge(
                mappedState$,
                mappedActions$
            );
            this.subscription = newProps$.subscribe(newProps => this.setState(newProps));
        }

        componentWillUnmount() {
            this.subscription.unsubscribe();
        }

        componentWillReceiveProps(nextProps) {
            this.storeStateSubject.next(nextProps.storeState);
            this.propsSubject.next(extractComponentProps(nextProps));
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
    return omit(props, ['storeState', 'dispatch']);
}
