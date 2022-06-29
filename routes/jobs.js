"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

//POST '/jobs' {title, salary, equity, company_handle} => {id, title, salary, equity, company_handle}
//Authorization: admin
router.post('/', ensureAdmin, async (req, res, next) => {
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({job});
    } catch(err) {
        return next(err);
    }
})

//GET '/' returns a list of all jobs
//=> {jobs: [{id, title, salary, equity, companyHandle}, ...]}
//Authorizarion: none

router.get('/', async(req, res, next) => {
    try {
        const terms = req.query
        console.log(terms)
        if(Object.keys(terms).length) {
            const keys = Object.keys(terms);
            //check the query arguments to make sure they are valid
            for(let key of keys) {
                if (['title', 'minSalary', 'hasEquity'].indexOf(key) === -1) throw new BadRequestError("Invalid query string parameters")
            };
            if (terms.hasEquity && terms.hasEquity !== 'true' && terms.hasEquity !== 'false') throw new BadRequestError("hasEquity must be true or false")
            
            if (terms.hasEquity === 'false') delete terms.hasEquity
        
            if (Object.keys(terms).length) {
                const jobs = await Job.findAll(terms);
                return res.json({jobs});
            }
        }
        const jobs = await Job.findAll();
        return res.json({jobs});
    } catch(err) {
        return next(err);
    }
})

//GET '/:id' returns an instance of the Job class
// => {job: {id, title, salary, equity, companyHandle}}
//Authorization: none

router.get('/:id', async (req, res, next) => {
    try {
        const job = await Job.get(req.params.id);
        return res.json({job});
    } catch(err) {
        return next(err);
    }
})

//PATCH '/:id' updates parts of a Job instance and saves them to DB
// => {job: {id, title, salary, equity, companyHandle}}
//Authorization: admin

router.patch('/:id', ensureAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          const err = new BadRequestError(errs);
          return next(err);
        }
        const job = await Job.get(req.params.id);
        for(let key of Object.keys(req.body)) {
          job[key] = req.body[key];
        }
        await job.save();
        return res.json({job});
    } catch(err) {
        return next(err);
    };
});

//DELETE '/:id' deletes job with id
// => {deleted: Job ${id}}
//Authorization: admin

router.delete('/:id', ensureAdmin, async (req, res, next) => {
    try {
        const job = await Job.get(req.params.id);
        await job.remove();
        return res.json({deleted: `Job ${req.params.id}`})
    } catch(err) {
        return next(err);
    }
})

module.exports = router;
