const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const User = require('./schema/user');
const Book = require('./schema/books');
const ShoppingCart = require('./schema/shoppingCart');

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            req.user = user;
        } catch (error) {
            console.error('Error fetching user data:', error);
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/', (req, res) => {
    res.render('logreg');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server Error');
        }
        res.redirect('/logreg');
    });
});
app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        const isAdmin = req.user.isAdmin;

        res.render('books', { books, isAdmin });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Server Error');
    }
})

app.get('/logreg', (req, res) => {
    res.render('logreg');
});


app.get('/user', requireAuth, async (req, res) => {
    try {

        const books = await Book.find();
        res.render('user', { user: req.user, books: books });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Server Error');
    }
});


app.post('/shoppingCart', requireAuth, async (req, res) => {
    const { bookId } = req.body;
    try {

        const foundBook = await Book.findById(bookId);
        if (!foundBook) {
            return res.status(404).send('Book not found');
        }

        const newItem = new ShoppingCart({
            userId: req.user._id,
            book: foundBook,
            quantity: 1
        });

        await newItem.save();


        res.redirect('/shoppingCart');
    } catch (error) {
        console.error('Error adding book to cart:', error);
        res.status(500).send('Server Error');
    }
});

// Маршрут для страницы корзины покупок
app.get('/shoppingCart', requireAuth, async (req, res) => {
    try {

        const shoppingCart = await ShoppingCart.find({ userId: req.user._id }).populate('book');

        res.render('shoppingCart', { shoppingCart });
    } catch (error) {
        console.error('Error fetching shopping cart:', error);
        res.status(500).send('Server Error');
    }
});

function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).send('Forbidden');
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    next();
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { message: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render('login', { message: 'Invalid username or password' });
        }

        req.session.userId = user._id;

        if (user.isAdmin) {
            return res.redirect('/books');
        } else {
            return res.redirect('/user');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server Error');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
