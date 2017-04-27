import React from 'react';
import {mount} from 'enzyme';
import isFunction from 'lodash/isFunction';
import {internals} from 'react-redux';
import Rx from 'rxjs';
import {connect} from './connect';

jest.mock('react-redux', () => {
    const {createElement} = require('react'); // eslint-disable-line global-require
    const INITIAL_STORE_STATE = {xyzzy: 'xyzzy'};
    let storeState = INITIAL_STORE_STATE;
    let lastAction;
    const dispatch = (action) => {
        lastAction = action;
        return action;
    };
    return {
        connect(stateToPropsMapper = () => ({})) {
            return WrappedComponent => props => (
                createElement(WrappedComponent, {
                    ...props,
                    ...stateToPropsMapper(storeState),
                    dispatch
                })
            );
        },
        internals: {
            INITIAL_STORE_STATE,
            get lastAction() {
                return lastAction;
            },
            get storeState() {
                return storeState;
            },
            set storeState(nextStoreState) {
                storeState = nextStoreState;
            }
        }
    };
});

describe('connect decorator', () => {
    function Foo() {
        return <div />;
    }

    it('should pass props to underlying/wrapped component', () => {
        const FooWrapper = connect()(Foo);
        const fooWrapper = mount(<FooWrapper bar={123} visible />);
        const foo = fooWrapper.find(Foo);
        expect(foo.props().bar).toEqual(123);
        expect(foo.props().visible).toBeTruthy();
    });

    it('should transduce store state to props by means of [stateToPropsMapper]', () => {
        const FooWrapper = connect(
            storeState$ => storeState$.map(({xyzzy}) => ({baz: xyzzy}))
        )(Foo);
        const fooWrapper = mount(<FooWrapper />);
        const foo = fooWrapper.find(Foo);
        expect(foo.props().baz).toEqual(internals.INITIAL_STORE_STATE.xyzzy);
        internals.storeState = {xyzzy: 123};
        fooWrapper.update();
        expect(foo.props().baz).toEqual(123);
    });

    it(`should provide [dispatch] operator/function as argument of [dispatchToActionsMapper]
        to "push" actions inside store`, () => {
        const doSomething = payload => ({type: 'SIDE_EFFECT', payload});
        const dispatchToActionsMapper = jest.fn(() => Rx.Observable.empty());
        const FooWrapper = connect(
            undefined,
            dispatchToActionsMapper
        )(Foo);
        mount(<FooWrapper />);
        expect(dispatchToActionsMapper).toBeCalled();
        const dispatch = dispatchToActionsMapper.mock.calls[0][0]; // first arg
        expect(isFunction(dispatch)).toBeTruthy();
        dispatch(doSomething(123));
        expect(internals.lastAction).toEqual(doSomething(123));
    });

    it('should inject declared actions into underlying/wrapped component', () => {
        const FooWrapper = connect(
            undefined,
            () => ({
                toggle: () => Rx.Observable.empty()
            })
        )(Foo);
        const fooWrapper = mount(<FooWrapper />);
        const foo = fooWrapper.find(Foo);
        expect(isFunction(foo.props().toggle)).toBeTruthy();
    });

    it('should interact with underlying/wrapped component by means of actions', () => {
        const FooWrapper = connect(
            undefined,
            () => ({
                toggle: visible$ => visible$.map(visible => ({visible: !visible}))
            })
        )(Foo);
        const fooWrapper = mount(<FooWrapper />);
        const foo = fooWrapper.find(Foo);
        foo.props().toggle(false);
        expect(foo.props().visible).toBeTruthy(); // visibility inversion
        foo.props().toggle(true);
        expect(foo.props().visible).toBeFalsy(); // visibility inversion
    });

    it('should interact with store by means of dispatched actions', () => {
        const doToggle = visible => ({type: 'DO_TOGGLE', visible});
        const FooWrapper = connect(
            undefined,
            dispatch => ({
                toggle: visible$ => visible$
                    ::dispatch(doToggle)
                    .ignoreElements()
            })
        )(Foo);
        const fooWrapper = mount(<FooWrapper />);
        const foo = fooWrapper.find(Foo);
        foo.props().toggle(true);
        expect(internals.lastAction).toEqual(doToggle(true));
        foo.props().toggle(false);
        expect(internals.lastAction).toEqual(doToggle(false));
    });
});
