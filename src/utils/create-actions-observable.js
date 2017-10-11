import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import {isObject, isNil} from './is';
import {mapValues} from './map-values';

export function createActionsObservable(actionsDefinitions) {
    if (isNil(actionsDefinitions)) {
        return Observable.empty();
    }
    if (actionsDefinitions instanceof Observable) {
        return actionsDefinitions;
    }
    if (!isObject(actionsDefinitions)) {
        throw new TypeError('[actionsDefinitions] should be a plain object or observable');
    }
    const actionsSubjects = createActionsSubjects(actionsDefinitions);
    const actions = createActions(actionsSubjects);
    const actionsOutput$ = Object.keys(actionsSubjects)
        .map(key => actionsDefinitions[key](actionsSubjects[key]));
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
