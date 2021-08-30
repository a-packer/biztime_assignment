/** Tests for invoices routes */

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
    test("Expecting an array of invoices", async function() {
        const response = await request(app).get("/invoices");
        expect(response.body).toEqual({
            "invoices": [
                {id: 1, comp_code: "apple"},
                {id: 2, comp_code: "apple"},
                {id: 3, comp_code: "ibm"}
            ]
        })
    })
})

describe("GET /:id", function() {
    test("Expecting invoice data", async function() {
        const response = await request(app).get("/invoices/1");
        expect(response.body).toEqual({
            "invoices": {
              "amt": 100,
              "comp_code": "apple"
            },
            "company": {
              "code": "apple",
              "name": "Apple Computer",
              "description": "Maker of OSX."
            }
        });
    });
    test("Expecting a 404 status for no such invoice", async function() {
        const response = await request(app).get("/invoices/1000");
        expect(response.error.status).toEqual(404);
    });
})

describe("POST /", function() {
    test("It should add a new invoice", async function() {
        const response = await request(app).post("/invoices").send({"amt": 300, "comp_code": 'ibm'});
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({"amt": 300, "comp_code": "ibm", "id": 4});
    })   
})

describe("PUT /", function() {
    test("It should update an existing invoice", async function() {
        const response = await (await request(app).put('/invoices/1').send({amt: 10, paid: false}));
        expect(response.status).toEqual(200)
    })

})

describe("DELETE /", function() {
    test("It should delete an invoice", async function() {
        const response = await request(app).delete("/invoices/1");
        expect(response.body).toEqual({"message": "Deleted"});
    })
})