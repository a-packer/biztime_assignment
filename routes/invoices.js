const express = require("express")
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")


router.get('/', async(req, res, next) => {
    try {
        const results = await db.query('SELECT id, comp_Code FROM invoices');
        return res.json({ invoices: results.rows });
    } catch(e) {
        return next(e);
    }
})

router.get('/:id', async(req,res, next) => {
    const id = req.params.id
    try {
        const results = await db.query(`SELECT amt, comp_Code FROM invoices WHERE id=$1`, [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`,404);
        } else {
            const comp_code = results.rows[0].comp_code
            const comp_results = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [comp_code]);
            return res.json({ invoices: results.rows[0], company: comp_results.rows[0]});
        }
    }
    catch(e) {
        return next(e);
    }
})

router.put('/:id', async(req, res, next) => {
    const id = req.params.id
    const amt = req.body.amt
    try {
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code`, [amt, id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`,404);
        } else {
            const invoice_results = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id=$1`, [id]);
            return res.status(201).json(invoice_results.rows[0])
        }
    } catch(e) {
        return next(e);
    }
})

router.delete('/:id', async(req, res, next) => {
    const id = req.params.id
    try {
        await db.query('DELETE FROM invoices WHERE id=$1', [id]);
        return res.json({message: "Deleted"});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;