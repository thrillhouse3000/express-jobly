"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(terms) {
    let queryStr = 
    `SELECT handle,
    name,
    description,
    num_employees AS "numEmployees",
    logo_url AS "logoUrl"
    FROM companies
    ORDER BY name`
    
    //checks for query terms, if they exist, validates data and creates a SQL WHERE clause string with the data and appends it to the queryStr, adding conjunctions when necessary
    if (terms !== undefined) {
        let keys = Object.keys(terms)
        if (keys.includes('minEmployees') && keys.includes('maxEmployees'))
          if(terms['minEmployees'] > terms['maxEmployees']) throw new BadRequestError("minEmployees can't be greater than maxEmployees")
        let searchStr = queryStr.replace('ORDER BY name', 'WHERE')
        let sqlTerms = []
        if (keys.includes('name')) sqlTerms.push(` name ILIKE '%${terms.name}%'`);
        if (keys.includes('minEmployees')) sqlTerms.push(` num_employees >= ${terms.minEmployees}`);
        if (keys.includes('maxEmployees')) sqlTerms.push(` num_employees <= ${terms.maxEmployees}`);
        for(let i = 0; i < sqlTerms.length; i++) {
          if(i === 0) {
            searchStr += sqlTerms[i]
          } else {
            searchStr += ` AND${sqlTerms[i]}`
          }
        }
        searchStr += ` ORDER BY name`
        queryStr = searchStr
    } 

    const companiesRes = await db.query(queryStr)
    const companies = companiesRes.rows
    if (companies.length === 0) throw new NotFoundError("No companies match those inputs")
    return companies;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  array_agg(json_build_object('id', j.id, 'title', j.title, 'salary', j.salary, 'equity', j.equity, 'companyHandle', j.company_handle)) filter (WHERE company_handle is not null) AS jobs
           FROM companies AS c
           LEFT JOIN jobs AS j
           ON c.handle = j.company_handle
           WHERE handle = $1
           GROUP BY c.handle`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
