import {createElement} from 'react';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {isFunction, isObject, isSame, createActionsObservable} from '../utils';
import {Config} from '../config';

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

    return WrappedComponent => class ReactiveWrapper extends Config.COMPONENT_BASE_CLASS {
        static displayName = `Reactive(${WrappedComponent.displayName || WrappedComponent.name})`;

        constructor(props) {
            super(props);
            this.state = props;
        }

        componentWillMount() {
            this.propsSubject = new BehaviorSubject(this.props);
            const outgoingProps$ = computeOutgoingProps(this.propsSubject);
            this.subscription = outgoingProps$
                .subscribe(outgoingProps => this.setState(outgoingProps));
        }

        componentWillUnmount() {
            this.propsSubject.complete();
            this.subscription.unsubscribe();
        }

        componentWillReceiveProps(nextProps) {
            this.propsSubject.next(nextProps);
        }

        render() {
            return createElement(WrappedComponent, this.state);
        }
    };

    function computeOutgoingProps(rawProps$) {
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
    }
}
