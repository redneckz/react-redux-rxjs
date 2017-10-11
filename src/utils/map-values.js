export function mapValues(o, valueMapper) {
    if (!o) {
        return {};
    }
    const result = {};
    Object.keys(o).forEach((key) => {
        result[key] = valueMapper(o[key]);
    });
    return result;
}
