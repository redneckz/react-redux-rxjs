import keys from 'lodash/keys';
import isPlainObject from 'lodash/isPlainObject';

export function isSame(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (!isPlainObject(objA) || !isPlainObject(objB)) {
        return false;
    }
    const keysA = keys(objA);
    const keysB = keys(objB);
    const sameSize = (keysA.length === keysB.length);
    const sameValues = () => keysA.every(key => (objA[key] === objB[key]));
    return sameSize && sameValues();
}
