import isPlainObject from 'lodash/isPlainObject';
import isNil from 'lodash/isNil';
import toPairs from 'lodash/toPairs';
import mapValues from 'lodash/mapValues';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';

export function createActionsObservable(actionsDefinitions) {
    if (isNil(actionsDefinitions)) {
        return Observable.empty();
    }
    if (actionsDefinitions instanceof Observable) {
        return actionsDefinitions;
    }
    if (!isPlainObject(actionsDefinitions)) {
        throw new TypeError('[actionsDefinitions] should be a plain object or observable');
    }
    const actionsSubjects = createActionsSubjects(actionsDefinitions);
    const actions = createActions(actionsSubjects);
    const actionsOutput$ = toPairs(actionsSubjects)
        .map(([key, subject]) => actionsDefinitions[key](subject));
    return Observable.merge(
        Observable.of(actions),
        ...actionsOutput$
    );
}

function createActionsSubjects(actionsDefinitions) {
    return mapValues(actionsDefinitions, () => new Subject());
}

function createActions(actionsSubjects) {
    return mapValues(actionsSubjects, subject => arg => subject.next(arg));
}
