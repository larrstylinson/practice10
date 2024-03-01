const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true }, // Добавляем поле автора
    genre: { type: String },
    publicationYear: { type: Number },
    quantityAvailable: { type: Number },
    price: { type: Number }
});

module.exports = mongoose.model('Book', bookSchema);
