import React from 'react';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/bufferCount';
import isFunction from 'lodash/isFunction';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import {mount} from 'enzyme';
import {reactive} from './reactive';

describe('reactive decorator', () => {
    function Foo() {
        return <div />;
    }

    let renderer;
    beforeEach(() => {
        renderer = new ReactShallowRenderer();
    });

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
            renderer.render(<FooWrapper bar={123} quux={456} />);
            const props = renderer.getRenderOutput().props;
            expect(props).toEqual({bar: 123, baz: 123, quux: 456});
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
            renderer.render(<FooWrapper bar={123} visible />);
            const props = renderer.getRenderOutput().props;
            expect(props.bar).toBe(123);
            expect(props.visible).toBeTruthy();
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            renderer.render(<FooWrapper />);
            const props = renderer.getRenderOutput().props;
            expect(isFunction(props.toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions', () => {
            renderer.render(<FooWrapper visible />);
            let props = renderer.getRenderOutput().props;
            expect(props.visible).toBeTruthy();
            props.toggle(props.visible);
            props = renderer.getRenderOutput().props;
            expect(props.visible).toBeFalsy();
        });
    });

    describe('@reactive(propsMapper, actionsDefinitions)', () => {
        const fetchBar = barId => Observable.of(`Bar #${barId}`);

        let FooWrapper;
        beforeEach(() => {
            FooWrapper = reactive(props$ => props$.switchMap(
                ({barId, ...rest}) => fetchBar(barId).map(bar => ({bar, ...rest}))
            ), {
                toggle: visible$ => visible$.map(visible => ({visible: !visible}))
            })(Foo);
        });

        it('should pass props to underlying/wrapped component through [propsMapper]', () => {
            renderer.render(<FooWrapper barId={123} quux={456} />);
            const props = renderer.getRenderOutput().props;
            expect(props.bar).toBe('Bar #123');
            expect(props.quux).toBe(456);
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            renderer.render(<FooWrapper />);
            const props = renderer.getRenderOutput().props;
            expect(isFunction(props.toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions', () => {
            renderer.render(<FooWrapper visible />);
            let props = renderer.getRenderOutput().props;
            expect(props.visible).toBeTruthy();
            props.toggle(props.visible);
            props = renderer.getRenderOutput().props;
            expect(props.visible).toBeFalsy();
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
            renderer.render(<FooWrapper baz={123} />);
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
                ({barId, ...rest}) => fetchBar(barId).map(bar => ({bar, ...rest}))
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
            renderer.render(<FooWrapper barId={123} quux={456} />);
            const props = renderer.getRenderOutput().props;
            expect(props.bar).toBe('Bar #123');
            expect(props.quux).toBe(456);
        });

        it('should inject declared actions into underlying/wrapped component', () => {
            renderer.render(<FooWrapper />);
            const props = renderer.getRenderOutput().props;
            expect(isFunction(props.toggle)).toBeTruthy();
        });

        it('should interact with underlying/wrapped component by means of actions transduced with [actionsMapper]', () => {
            renderer.render(<FooWrapper barId={123} visible />);
            let props = renderer.getRenderOutput().props;
            expect(props.visible).toBeTruthy();
            props.toggle(props.visible);
            props = renderer.getRenderOutput().props;
            expect(props.visible).toBeFalsy();
            expect(props.message).toBe('Bar #123 was closed');
            props.toggle(props.visible);
            props = renderer.getRenderOutput().props;
            expect(props.visible).toBeTruthy();
            expect(props.message).toBe('Bar #123 was opened');
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
