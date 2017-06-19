import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/do';

export const observableActionMiddleware = ({
    errorActionCreator, completedActionCreator
} = {}) => store => next => (action) => {
    if (action instanceof Observable) {
        const {dispatch} = store;
        return action.do(
            dispatch,
            errorActionCreator && (err => dispatch(errorActionCreator(err))),
            completedActionCreator && (() => dispatch(completedActionCreator()))
        );
    }
    return next(action);
};
