"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for jobs. */

class Job {
    constructor(id, title, salary, equity, company_handle) {
        this.id = id;
        this.title = title;
        this.salary = salary;
        this.equity = equity;
        this.companyHandle = company_handle;
    }

//create a new job entry:
//{title, salary, equity, company_handle} =>
//returns {id, title, salary, equity, company_handle}
  static async create({ title, salary, equity, company_handle }) {

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          company_handle
        ]
    );
    const job = result.rows[0];

    return job;
  }

//find all jobs
//returns [{id, title, salary, equity, company_handle}, ...]

  static async findAll(terms) {
    let queryStr = 
    `SELECT id,
    title,
    salary,
    equity,
    company_handle AS "companyHandle"
    FROM jobs
    ORDER BY title`

    if (terms !== undefined) {
        let keys = Object.keys(terms)
        let searchStr = queryStr.replace('ORDER BY title', 'WHERE')
        let sqlTerms = []
        if (keys.includes('title')) sqlTerms.push(` title ILIKE '%${terms.title}%'`);
        if (keys.includes('minSalary')) sqlTerms.push(` salary >= ${terms.minSalary}`);
        if (keys.includes('hasEquity')) sqlTerms.push(` equity > 0`);
     
        for(let i = 0; i < sqlTerms.length; i++) {
          if(i === 0) {
            searchStr += sqlTerms[i]
          } else {
            searchStr += ` AND${sqlTerms[i]}`
          }
        }
        searchStr += ` ORDER BY title`
        queryStr = searchStr
    } 

    console.log(queryStr)
    const jobsRes = await db.query(queryStr)
    const jobs = jobsRes.rows
    if (jobs.length === 0) throw new NotFoundError("No jobs match those inputs")
    return jobs;
  }

 //find a job based on it's id
 //returns an instance of the Job class

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id=$1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return new Job(job.id, job.title, job.salary, job.equity, job.companyHandle);
  }

  //update a job by saving it's modified instance to the database
  //allows flxible updating
  //can only update title, salary and equity

  async save(){
    await db.query(
        `UPDATE jobs
        SET title=$1,
        salary=$2,
        equity=$3
        WHERE id=$4
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [this.title, this.salary, this.equity, this.id]
    )
  }

  //delete a job from the database

  async remove() {
    await db.query(
          `DELETE
           FROM jobs
           WHERE id=$1
           RETURNING id`,
        [this.id]);
  }
}


module.exports = Job;
