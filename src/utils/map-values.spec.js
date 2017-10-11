import {mapValues} from './map-values';

describe('mapValues', () => {
    it('should map value for each own key', () => {
        expect(
            mapValues(
                {a: 1, b: 2, c: 3},
                v => v * v
            )
        ).toEqual({a: 1, b: 4, c: 9});
    });

    it('should return empty object if empty value or empty object was passed', () => {
        expect(mapValues(null)).toEqual({});
        expect(mapValues(undefined)).toEqual({});
        expect(mapValues({})).toEqual({});
    });
});
