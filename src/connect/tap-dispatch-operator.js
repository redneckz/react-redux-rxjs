import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import cond from 'lodash/cond';
import identity from 'lodash/identity';

const adjustValueToAction = cond([
    // Common case (Observable of actions)
    [isPlainObject, identity],
    // #2 Make dispatch operator smart
    [isFunction, actionCreator => actionCreator()]
]);

export function tapDispatchOperator(dispatch) {
    return function tapDispatch(
        actionCreator,
        errorActionCreator,
        completedActionCreator
    ) {
        if (this && isFunction(this.do)) {
            return this
                .map(actionCreator || adjustValueToAction || identity)
                .filter(Boolean)
                .do(
                    dispatch,
                    errorActionCreator && (err => dispatch(errorActionCreator(err))),
                    completedActionCreator && (() => dispatch(completedActionCreator()))
                );
        }
        const action = actionCreator;
        return dispatch(action);
    };
}
