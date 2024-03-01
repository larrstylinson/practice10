const express = require('express');
const router = express.Router();
const Book = require('../schema/books');

router.post('/', async (req, res) => {
    try {
        const { title, author, genre, publicationYear, quantityAvailable, price } = req.body;

        if (req.user && req.user.isAdmin) {
            const newBook = new Book({ title, author, genre, publicationYear, quantityAvailable, price });
            await newBook.save();
            res.redirect('/books');
        } else {
            if (author === req.user.username) {
                const newBook = new Book({ title, author, genre, publicationYear, quantityAvailable, price });
                await newBook.save();
                res.redirect('/books');
            } else {
                res.status(403).send('Forbidden');
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
