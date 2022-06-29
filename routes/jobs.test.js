"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//POST /jobs

describe('POST /jobs', () => {
    const newJob = {title: 'newTitle', salary: 100, equity: 0.1, company_handle: 'c1'}
    test('works for admin', async() => {
        const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({job: {id: 4, title: 'newTitle', salary: 100, equity: '0.1', companyHandle: 'c1'}});
    });

    test("doesn't work for users", async() => {
        const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
    });

    test("bad request missing data", async() => {
        const resp = await request(app)
        .post("/jobs")
        .send({title: "newTitle", salary: 100, company_handle:'c1'})
        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });

    test("bad request invalid data", async() => {
        const resp = await request(app)
        .post("/jobs")
        .send({title: "newTitle", salary: 100, equity: 'potato', company_handle:'c1'})
        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });
});

//GET /jobs

describe("GET /jobs", () => {
    test("works for anon", async() => {
        const resp = await request(app).get('/jobs')
        expect(resp.body).toEqual({
            jobs:
            [
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
                    companyHandle: 'c1'
                },
                {
                    id: 3,
                    title: 'j3',
                    salary: 3,
                    equity: '0',
                    companyHandle: 'c3'
                }
            ]
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });

    test('works with filter', async() => {
      const resp = await request(app).get('/jobs/?title=j1')
      expect(resp.body).toEqual({
          jobs:
          [
              {
                  id: 1,
                  title: 'j1',
                  salary: 1,
                  equity: '0.1',
                  companyHandle: 'c1'
              }
          ]
      });
    });

    test('hasEquity must be true or false', async() => {
      const resp = await request(app).get('/jobs/?hasEquity=potato');
      expect(resp.statusCode).toBe(400);
    });

    test('works when hasEquity is false', async() => {
      const resp = await request(app).get('/jobs/?hasEquity=false&minSalary=2');
      expect(resp.body).toEqual({
            jobs:
            [
                {
                    id: 2,
                    title: 'j2',
                    salary: 2,
                    equity: '0.2',
                    companyHandle: 'c1'
                },
                {
                    id: 3,
                    title: 'j3',
                    salary: 3,
                    equity: '0',
                    companyHandle: 'c3'
                }
            ]
        });
    });

    test('400 with invalid search inputs', async() => {
        const resp = await request(app).get('/jobs/?potato=potato');
        expect(resp.statusCode).toBe(400);
    });
});

//GET /jobs/:id

describe('GET /jobs/:id', () => {
    test('works for anon', async() => {
        const resp = await request(app).get('/jobs/1');
        expect(resp.body).toEqual({
            job:
            {
                id: 1,
                title: 'j1',
                salary: 1,
                equity: '0.1',
                companyHandle: 'c1'
            }
        });
    });

    test('404 if company w/ id doesnt exist', async() => {
        const resp = await request(app).get('/jobs/1000');
        expect(resp.statusCode).toBe(404);
    })
});

//PATCH /jobs/:id

describe("PATCH /jobs/:id", () => {
    test('doesnt work for users', async() => {
        const resp = await request(app).patch('/jobs/1').send({salary: 2}).set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test('doesnt work for anon', async() => {
        const resp = await request(app).patch('/jobs/1').send({salary: 2});
        expect(resp.statusCode).toBe(401);
    });

    test('works for admin', async() => {
        const resp = await request(app).patch('/jobs/1').send({salary: 2}).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            job:
            {
                id: 1,
                title: 'j1',
                salary: 2,
                equity: '0.1',
                companyHandle: 'c1'
            }
        });
    });

    test('404 if no job w/ id', async() => {
        const resp = await request(app).patch('/jobs/1000').send({salary: 2}).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(404);
    });

    test('bad request if trying to change id', async() => {
        const resp = await request(app).patch('/jobs/1').send({id: 2}).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });

    test('bad request if trying to change company_handle', async() => {
        const resp = await request(app).patch('/jobs/1').send({company_handle: 'bloop'}).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });

    test('bad request if invalid data', async() => {
        const resp = await request(app).patch('/jobs/1').send({salary: 'one'}).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });
});

// DELETE /jobs/:id

describe('DELETE /jobs/:id', () => {
    test('doesnt work for user', async() => {
        const resp = await request(app).delete('/jobs/1').set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test('doesnt work for anon', async() => {
        const resp = await request(app).delete('/jobs/1')
        expect(resp.statusCode).toBe(401);
    });

    test('works for admin', async() => {
        const resp = await request(app).delete('/jobs/1').set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({deleted: 'Job 1'})
    });

    test('404 if company w/ id doesnt exist', async() => {
        const resp = await request(app).delete('/jobs/1000').set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(404);
    });

});