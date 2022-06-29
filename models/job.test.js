"use strict";

const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//Job.create()

describe('test Job.create()', () => {
    const newJob = {
        title: 'newTitle',
        salary: 100,
        equity: '0.1',
        company_handle: 'c1'
    }
    test('create works', async () => {
        let job = await Job.create(newJob);
        expect(job).toEqual(job);

        const result = await db.query(`SELECT title, salary, equity, company_handle FROM jobs WHERE id = ${job.id}`);
        expect(result.rows[0]).toEqual(newJob);
    });
});

//Job.findAll()

describe('test Job.findAll()', () => {
    test('findAll() works, no filter', async() => {
        const jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: 1,
                title: 'j1',
                salary: 1,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: 2,
                title: 'j2',
                salary: 2,
                equity: '0.2',
                companyHandle: 'c2'
            },
            {
                id: 3,
                title: 'j3',
                salary: 3,
                equity: '0',
                companyHandle: 'c3'
            }
        ]);
    });

    test('works, 1 filter arg (case insensitive)', async() => {
        const jobs = await Job.findAll({title: 'j2'})
        expect(jobs).toEqual([{
            id: 2,
            title: 'j2',
            salary: 2,
            equity: '0.2',
            companyHandle: 'c2'
        }]);
    });

    test('works, 2 filter args (case insensitive)', async() => {
        const jobs = await Job.findAll({title: 'J', minSalary: 2})
        expect(jobs).toEqual([{
            id: 2,
            title: 'j2',
            salary: 2,
            equity: '0.2',
            companyHandle: 'c2'
        },
        {
            id: 3,
            title: 'j3',
            salary: 3,
            equity: '0',
            companyHandle: 'c3'
        }]);
    });

    test('works, 3 filter args (case insensitive)', async() => {
        const jobs = await Job.findAll({title: 'J', minSalary: 2, hasEquity: true})
        expect(jobs).toEqual([{
            id: 2,
            title: 'j2',
            salary: 2,
            equity: '0.2',
            companyHandle: 'c2'
        }]);
    });
});

//Job.get(id)

describe('test Job.get(id)', () => {
    test('works', async() => {
        const job = await Job.get(1);
        expect(job).toEqual({
            id: 1,
            title: 'j1',
            salary: 1,
            equity: '0.1',
            companyHandle: 'c1'
        });
    });
    test('404 if no such company', async() => {
        try {
            await Job.get(1000);
            fail();
        } catch(err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };     
    });
});

//job.save()

describe('test job.save() instance method', () => {
    test('works', async() => {
        const job = await Job.get(1);
        job.title = 'j111';
        job.salary = 111;
        job.equity = '0.111'
        await job.save();
        const updatedJob = await Job.get(1);
        expect(updatedJob).toEqual(
            {
                id: 1,
                title: 'j111',
                salary: 111,
                equity: '0.111',
                companyHandle: 'c1'
            });
    });
    test('works without all parameters', async() => {
        const job = await Job.get(2);
        job.title = 'j222';
        job.equity = '0.222'
        await job.save();
        const updatedJob = await Job.get(2);
        expect(updatedJob).toEqual(
            {
                id: 2,
                title: 'j222',
                salary: 2,
                equity: '0.222',
                companyHandle: 'c2'
            });
    });
});

//job.remove()

describe('test job.remove()', () => {
    test('works', async() => {
        const job = await Job.get(1);
        await job.remove();
        const jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: 2,
                title: 'j2',
                salary: 2,
                equity: '0.2',
                companyHandle: 'c2'
            },
            {
                id: 3,
                title: 'j3',
                salary: 3,
                equity: '0',
                companyHandle: 'c3'
            }
        ]);
    });
});