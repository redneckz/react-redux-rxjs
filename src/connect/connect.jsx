import React from 'react';
import {connect as reduxConnect} from 'react-redux';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import omit from 'lodash/omit';
import Rx from 'rxjs';
import {isSame, createActionsObservable} from '../utils';
import {tapDispatchOperator} from './tap-dispatch-operator';

export function connect(
    stateToPropsMapper = (storeState$, props$) => props$,
    dispatchToActionsMapper = () => Rx.Observable.empty()
) {
    if (!isFunction(stateToPropsMapper)) {
        throw new TypeError('[stateToPropsMapper] should be a function');
    }
    if (!isFunction(dispatchToActionsMapper)) {
        throw new TypeError('[dispatchToActionsMapper] should be a function');
    }
    return WrappedComponent => reduxConnect(
        storeState => ({storeState})
    )(class ReactiveConnectWrapper extends React.PureComponent {
        static displayName = `ReactiveConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

        static internals = {WrappedComponent, stateToPropsMapper, dispatchToActionsMapper};

        constructor(props) {
            super(props);
            this.state = props;
            this.storeStateSubject = new Rx.BehaviorSubject(props.storeState);
            this.propsSubject = new Rx.BehaviorSubject(extractComponentProps(props));
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
            const newProps$ = Rx.Observable.merge(
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
