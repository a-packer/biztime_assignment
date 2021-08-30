/** Tests for companies routes */

process.env.NODE_ENV = 'test';

const request = require("supertest");

const app = require("../app");
const db = require("../db");


async function createData() {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
  
    await db.query(`INSERT INTO companies (code, name, description)
                      VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
                             ('ibm', 'IBM', 'Big blue.')`);
  
    await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
            VALUES ('apple', 100, false, '2018-01-01', null),
                    ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                    ('ibm', 300, false, '2018-03-01', null)
            RETURNING id`);
}


// clean data before each test
beforeEach(async () => {
    await createData()
})

afterAll(async () => {
    await db.end()
})

describe("GET /", function() {
    test("Expecting an array of companies", async function() {
        const response = await request(app).get("/companies");
        expect(response.body).toEqual({
                "companies": [
                  {
                    "code": "apple",
                    "name": "Apple Computer",
                    "description": "Maker of OSX."
                  },
                  {
                    "code": "ibm",
                    "name": "IBM",
                    "description": "Big blue."
                  }
                ]
        })
    })
})

describe("GET /:code", function() {
    test("Expecting company data", async function() {
        const response = await request(app).get("/companies/ibm");
        expect(response.body).toEqual({
            "company": [{
                "code": "ibm",
                "name": "IBM",
                "description": "Big blue."
            }], 
            "invoices": [{
                "id": 3
            }]
        });
    });
})

describe("POST /", function() {
    test("It should add a new company", async function() {
        const response = await request(app).post("/companies").send({"code": "cafe", "name": "Cool Cafe", "description": "Cafe with coffee"});
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({"code": "cafe", "description": "Cafe with coffee", "name": "Cool Cafe"})
    })   
})

describe("PUT /", function() {
    test("It should update an existing company", async function() {
        const response = await (await request(app).put('/companies/apple').send({"code": "apple", "name": "Coolest Apple", "description": "Cafe with apples"}));
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({"code": "apple", "name": "Coolest Apple", "description": "Cafe with apples"})
    })
})

describe("DELETE /", function() {
    test("It should delete a company", async function() {
        const response = await request(app).delete("/companies/cafe");
        expect(response.body).toEqual({"message": "Deleted"});
    })
})