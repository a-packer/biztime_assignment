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

router.post('/', async(req, res, next) =>{
    const comp_code = req.body.comp_code;
    const amt = req.body.amt;
    try {
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt`, [comp_code, amt])
        return res.status(201).json(results.rows[0]);
    } catch(e) {
        return next(e);
    }
})

router.put('/:id', async(req, res, next) => {
    try {
        const id = req.params.id;
        let amt = req.body.amt;
        let paid = req.body.paid;
        let paidDate = null;
    
        initialResult = await db.query('SELECT invoice WHERE id=$1', [id]);
    
        if ( initialResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404)
        }
    
        const  initialPaidDate =  initialResult.rows[0].paid_date

        // if invoice is paid, but there is no date, set the date
        if (paid &&  initialPaidDate) {
            paidDate = new Date();
        // if the invoice isn't paid, keep paidDate null
        } else if (!paid) {
            paidDate = null;
        // else if paid, and there is a paidDate already, keep it as is
        } else {
            paidDate = initialPaidDate;
        }

        const result = db.query(`UPDATE invoice 
            SET amt=$1, paid=$2, paid_date=$3 
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, paidDate, id]);
        
        return res.json({"invoice": result.rows[0]})
        
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