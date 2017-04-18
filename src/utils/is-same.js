import keys from 'lodash/keys';
import size from 'lodash/size';
import isPlainObject from 'lodash/isPlainObject';

export function isSame(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (!isPlainObject(objA) || !isPlainObject(objB)) {
        return false;
    }
    const sameSize = (size(objA) === size(objB));
    const sameValues = () => keys(objA).every(key => (objA[key] === objB[key]));
    return sameSize && sameValues();
}
