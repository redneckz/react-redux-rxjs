import isPlainObject from 'lodash/isPlainObject';
import isNil from 'lodash/isNil';
import toPairs from 'lodash/toPairs';
import mapValues from 'lodash/mapValues';
import Rx from 'rxjs';

export function createActionsObservable(actionsDefinitions) {
    if (isNil(actionsDefinitions)) {
        return Rx.Observable.empty();
    }
    if (actionsDefinitions instanceof Rx.Observable) {
        return actionsDefinitions;
    }
    if (!isPlainObject(actionsDefinitions)) {
        throw new TypeError('[actionsDefinitions] should be a plain object or observable');
    }
    const actionsSubjects = createActionsSubjects(actionsDefinitions);
    const actions = createActions(actionsSubjects);
    const actionsOutput$ = toPairs(actionsSubjects)
        .map(([key, subject]) => actionsDefinitions[key](subject));
    return Rx.Observable.merge(
        Rx.Observable.of(actions),
        ...actionsOutput$
    );
}

function createActionsSubjects(actionsDefinitions) {
    return mapValues(actionsDefinitions, () => new Rx.Subject());
}

function createActions(actionsSubjects) {
    return mapValues(actionsSubjects, subject => arg => subject.next(arg));
}
