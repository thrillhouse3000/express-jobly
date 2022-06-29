const { BadRequestError } = require("../expressError");
const {sqlForPartialUpdate} = require('./sql');

describe('Convert data to SQL format', () => {
    test('returns BadRequestError if no data', () => {
        expect(() => {sqlForPartialUpdate({}, {firstName: 'first_name'})}).toThrow(BadRequestError)
    });
    test('returns correct format', () => {
        const res = sqlForPartialUpdate({firstName: 'Aliya', lastName: 'Trang'}, {firstName: 'first_name', lastName:'last_name'});
        expect(res).toEqual({setCols: '"first_name"=$1, "last_name"=$2', values: ['Aliya', 'Trang']})
    })
})
