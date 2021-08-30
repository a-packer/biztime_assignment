const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// get /companies
router.get('/', async(req, res, next) => {
    try {
        const results = await db.query('SELECT code, name, description FROM companies');
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
})

router.get('/:code', async(req, res, next) => {
        try {
            const code = req.params.code
            const results = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]);
            if (results.rows.length !== 0) {
                invoice_results = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);
                console.log(invoice_results.rows)
                return res.json({ company: results.rows, invoices: invoice_results.rows });
            }
            else {
                return next();
            }
        } catch(e) {
            return next(e);
        }
    })

router.post('/', async(req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json(results.rows[0])
    } catch (e) {
        return next(e);
    }
})


router.put('/:code', async(req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query(`UPDATE companies SET name=$2, description=$3 WHERE code = $1 RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json(results.rows[0])
    } catch (e) {
        return next(e);
    }
}) 

router.delete('/:code', async(req, res, next) => {
    try {
        await db.query(
            "DELETE FROM companies WHERE code = $1",
            [req.params.code]
        );
        return res.json({message: "Deleted"});
      } catch (e) {
        return next(e);
    }
})


module.exports = router;