export function isFunction(o) {
    return typeof o === 'function';
}

export function isObject(o) {
    return o && (typeof o === 'object')
        && (Object.prototype.toString.call(o) === '[object Object]');
}

export function isNil(o) {
    return (o === null) || (o === undefined);
}

export function isSame(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (!isObject(objA) || !isObject(objB)) {
        return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    const sameSize = (keysA.length === keysB.length);
    const sameValues = () => keysA.every(key => (objA[key] === objB[key]));
    return sameSize && sameValues();
}
