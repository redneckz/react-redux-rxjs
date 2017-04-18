import isFunction from 'lodash/isFunction';
import identity from 'lodash/identity';

export function tapDispatchOperator(dispatch) {
    return function tapDispatch(
        actionCreator = identity,
        errorActionCreator,
        completedActionCreator
    ) {
        if (this && isFunction(this.do)) {
            return this.do(
                arg => dispatch(actionCreator(arg)),
                errorActionCreator && (err => dispatch(errorActionCreator(err))),
                completedActionCreator && (() => dispatch(completedActionCreator()))
            );
        }
        const action = actionCreator;
        return dispatch(action);
    };
}
