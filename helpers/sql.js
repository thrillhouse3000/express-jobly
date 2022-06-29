const { BadRequestError } = require("../expressError");

//sqlForPartialUpdate: Accepts two parameters
//
//dataToUpdate - the req.body with the specific fields to be updated, 
//ex) {firstName: 'Aliya', lastName: 'Trang', age: 32}
//
//jsToSql - an object relating the req.body JS keys to our SQL columns format
//ex) {firstName: "first_name", lastName: "last_name"} 
//
//returns a string of column names with placeholders and an array of values to be passed to our SQL query
//ex) sqlForPartialUpdate({firstName: 'Aliya', lastName: 'Trang'}, {firstName: 'first_name', lastName: 'last_name'})
// => {setCols: '"first_name"=$1, "last_name"=$2', values: [ 'Aliya', 'Trang' ]}

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //makes an array of keys for the fields being updated
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  //converts our js keys to SQL column names and replaces their values with input sanitizing placeholders
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  //returns a string of column names with placeholders and an array of values to be passed to our SQL query
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
