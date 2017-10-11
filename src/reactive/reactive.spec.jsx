import React from 'react';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/bufferCount';
import Enzyme, {mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {isFunction} from '../utils';
import {reactive} from './reactive';

Enzyme.configure({adapter: new Adapter()});

describe('reactive decorator', () => {
    function Foo() {
        return <div />;
    }

    describe('@reactive(propsMapper)', () => {
        let onComplete;
        let FooWrapper;
        beforeEach(() => {
            onComplete = jest.fn();
            FooWrapper = reactive(props$ => props$.map(
                ({bar}) => ({baz: bar})
            ).finally(onComplete))(Foo);
        });

        it('should pass props to underlying/wrapped component through [propsMapper]', () => {
            const fooWrapper = mount(<FooWrapper bar={123} quux={456} />);
            const foo = fooWrapper.find(Foo);
            expect(foo.props()).toEqual({bar: 123, baz: 123, quux: 456});
        });

        it('should pass completion event on unmount', () => {
            const fooWrapper = mount(<FooWrapper />);
            fooWrapper.unmount();
            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });

    describe('@reactive(actionsDefinitions)', () => {
        let FooWrapper;
        beforeEach(() => {
            FooWrapper = reactive({
                toggle: visible$ => visible$.map(visible => ({visible: !visible}))
            })(Foo);
        });

        it('should pass props to underlying/wrapped component', () => {
            const fooWrapper = mount(<FooWrapper bar={123} visible />);
            const foo = fooWrapper.find(Foo);
            expect(foo.props().bar).toBe(123);
            expect(foo.props().visible).toBeTruthy();
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            const fooWrapper = mount(<FooWrapper />);
            const foo = fooWrapper.find(Foo);
            expect(isFunction(foo.props().toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions', () => {
            const fooWrapper = mount(<FooWrapper visible />);
            const fooProps = () => fooWrapper.find(Foo).props();
            expect(fooProps().visible).toBeTruthy();
            fooProps().toggle(fooProps().visible);
            fooWrapper.update();
            expect(fooProps().visible).toBeFalsy();
        });
    });

    describe('@reactive(propsMapper, actionsDefinitions)', () => {
        const fetchBar = barId => Observable.of(`Bar #${barId}`);

        let FooWrapper;
        beforeEach(() => {
            FooWrapper = reactive(props$ => props$.switchMap(
                ({barId}) => fetchBar(barId).map(bar => ({bar}))
            ), {
                toggle: visible$ => visible$.map(visible => ({visible: !visible}))
            })(Foo);
        });

        it('should pass props to underlying/wrapped component through [propsMapper]', () => {
            const fooWrapper = mount(<FooWrapper barId={123} quux={456} />);
            const foo = fooWrapper.find(Foo);
            expect(foo.props().bar).toBe('Bar #123');
            expect(foo.props().quux).toBe(456);
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            const fooWrapper = mount(<FooWrapper />);
            const foo = fooWrapper.find(Foo);
            expect(isFunction(foo.props().toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions', () => {
            const fooWrapper = mount(<FooWrapper visible />);
            const fooProps = () => fooWrapper.find(Foo).props();
            expect(fooProps().visible).toBeTruthy();
            fooProps().toggle(fooProps().visible);
            fooWrapper.update();
            expect(fooProps().visible).toBeFalsy();
        });
    });

    describe('@reactive(propsMapper, actionsMapper)', () => {
        const actionsMapperMock = jest.fn(() => ({}));
        let FooWrapper;
        beforeEach(() => {
            FooWrapper = reactive(props$ => props$.map(
                ({baz}) => ({quuz: baz})
            ), actionsMapperMock)(Foo);
        });

        it('should pass original props as well as transformed props to [actionsMapper]', (done) => {
            mount(<FooWrapper baz={123} />);
            const props$ = actionsMapperMock.mock.calls[0][0];
            props$.subscribe((fooArgs) => {
                expect(fooArgs).toEqual({baz: 123, quuz: 123});
                done();
            });
        });
    });

    describe('@reactive(propsMapper, actionsMapper)', () => {
        const fetchBar = barId => Observable.of(`Bar #${barId}`);

        let onComplete;
        let FooWrapper;
        beforeEach(() => {
            onComplete = jest.fn();
            FooWrapper = reactive(props$ => props$.switchMap(
                ({barId}) => fetchBar(barId).map(bar => ({bar}))
            ), props$ => ({
                toggle: visible$ => visible$
                    .withLatestFrom(props$)
                    .map(([visible, {bar}]) => ({
                        visible: !visible,
                        message: visible ? `${bar} was closed` : `${bar} was opened`
                    }))
                    .finally(onComplete)
            }))(Foo);
        });

        it('should pass props to underlying/wrapped component through [propsMapper]', () => {
            const fooWrapper = mount(<FooWrapper barId={123} quux={456} />);
            const foo = fooWrapper.find(Foo);
            expect(foo.props().bar).toBe('Bar #123');
            expect(foo.props().quux).toBe(456);
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            const fooWrapper = mount(<FooWrapper />);
            const foo = fooWrapper.find(Foo);
            expect(isFunction(foo.props().toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions transduced with [actionsMapper]', () => {
            const fooWrapper = mount(<FooWrapper barId={123} visible />);
            const fooProps = () => fooWrapper.find(Foo).props();
            expect(fooProps().visible).toBeTruthy();
            fooProps().toggle(fooProps().visible);
            fooWrapper.update();
            expect(fooProps().visible).toBeFalsy();
            expect(fooProps().message).toBe('Bar #123 was closed');
            fooProps().toggle(fooProps().visible);
            fooWrapper.update();
            expect(fooProps().visible).toBeTruthy();
            expect(fooProps().message).toBe('Bar #123 was opened');
        });

        it('should pass completion event on unmount', () => {
            const fooWrapper = mount(<FooWrapper />);
            fooWrapper.unmount();
            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should fail if [propsMapper] is not a function', () => {
            expect(() => reactive(null)).toThrow(TypeError);
        });
        it('should fail if [actionsMapper] is not a function and not an object', () => {
            expect(() => reactive(undefined, null)).toThrow(TypeError);
        });
    });
});
