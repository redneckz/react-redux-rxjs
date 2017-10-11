import {createElement} from 'react';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Config} from '../config';

export const reactiveWrapper = (
    propsMapper,
    propsCleaner = props => props
) => WrappedComponent => (
    class ReactiveWrapper extends Config.COMPONENT_BASE_CLASS {
        static displayName = `Reactive(${WrappedComponent.displayName || WrappedComponent.name})`;

        constructor(props) {
            super(props);
            this.state = propsCleaner(props);
        }

        componentWillMount() {
            this.propsSubject = new BehaviorSubject(this.props);
            const outgoingProps$ = propsMapper(this.props)(this.propsSubject);
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
    }
);
