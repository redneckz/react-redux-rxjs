import React from 'react';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/withLatestFrom';
import isFunction from 'lodash/isFunction';
import ReactShallowRenderer from 'react-test-renderer/shallow';
import {reactive} from './reactive';

describe('reactive decorator', () => {
    function Foo() {
        return <div />;
    }

    let renderer;
    beforeEach(() => {
        renderer = new ReactShallowRenderer();
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
            expect(props.bar).toEqual(123);
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
            expect(props.bar).toEqual('Bar #123');
            expect(props.quux).toEqual(456);
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
        const fetchBar = barId => Observable.of(`Bar #${barId}`);

        let FooWrapper;
        beforeEach(() => {
            FooWrapper = reactive(props$ => props$.switchMap(
                ({barId, ...rest}) => fetchBar(barId).map(bar => ({bar, ...rest}))
            ), props$ => ({
                toggle: visible$ => visible$
                    .withLatestFrom(props$)
                    .map(([visible, {bar}]) => ({
                        visible: !visible,
                        message: visible ? `${bar} was closed` : `${bar} was opened`
                    }))
            }))(Foo);
        });

        it('should pass props to underlying/wrapped component through [propsMapper]', () => {
            renderer.render(<FooWrapper barId={123} quux={456} />);
            const props = renderer.getRenderOutput().props;
            expect(props.bar).toEqual('Bar #123');
            expect(props.quux).toEqual(456);
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
            expect(props.message).toEqual('Bar #123 was closed');
            props.toggle(props.visible);
            props = renderer.getRenderOutput().props;
            expect(props.visible).toBeTruthy();
            expect(props.message).toEqual('Bar #123 was opened');
        });

        it('should fail if [propsMapper] is not a function', () => {
            expect(() => reactive(null)).toThrow(TypeError);
        });
        it('should fail if [actionsMapper] is not a function and not an object', () => {
            expect(() => reactive(undefined, null)).toThrow(TypeError);
        });
    });
});
