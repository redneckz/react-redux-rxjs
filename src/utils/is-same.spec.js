import {isSame} from './is-same';

describe('isSame', () => {
    class Foo {
        constructor(bar, baz, quux) {
            this.bar = bar;
            this.baz = baz;
            this.quux = quux;
        }
    }

    function foo(bar, baz, quux) {
        return {bar, baz, quux};
    }

    it('should compare scalars', () => {
        expect(isSame(1, 1)).toBeTruthy();
        expect(isSame(1, 2)).toBeFalsy();
        expect(isSame('1', '1')).toBeTruthy();
        expect(isSame('1', '2')).toBeFalsy();
        expect(isSame(true, true)).toBeTruthy();
        expect(isSame(true, false)).toBeFalsy();
    });

    it('should compare nils', () => {
        expect(isSame(null, null)).toBeTruthy();
        expect(isSame(null, undefined)).toBeFalsy();
        expect(isSame(undefined, undefined)).toBeTruthy();
    });

    it('should strictly compare scalars', () => {
        expect(isSame(1, '1')).toBeFalsy();
        expect(isSame('1', '1')).toBeTruthy();
    });

    it('should compare only plain objects and scalars (returns false in other cases)', () => {
        expect(isSame([1, 2, 3], [1, 2, 3])).toBeFalsy();
        expect(isSame(new Foo(1, 2, 3), new Foo(1, 2, 3))).toBeFalsy();
        expect(isSame(/\d+/, /\d+/)).toBeFalsy();
    });

    it('should shallowly compare plain objects', () => {
        const objA = foo(1, 2, 3);
        const objB = foo(1, 2, 3);
        const objC = foo(4, 5, 6);
        expect(isSame(
            foo(objA, objB, objC),
            foo(objA, objB, objC))
        ).toBeTruthy();
        expect(isSame(
            foo(objA, objB, objC),
            foo(foo(1, 2, 3), objB, objC)
        )).toBeFalsy();
    });
});
