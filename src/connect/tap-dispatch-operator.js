import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import {isFunction} from '../utils';

export function tapDispatchOperator(dispatch) {
    return function tapDispatch(
        actionCreator,
        errorActionCreator,
        completedActionCreator
    ) {
        if (this && isFunction(this.do)) {
            return this
                .map(actionCreator || adjustValueToAction)
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

function adjustValueToAction(action) {
    // #2 Make dispatch operator smart
    return isFunction(action) ? action() : action;
}
