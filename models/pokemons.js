const mongoose = require('mongoose');

const descriptionSchema = mongoose.Schema({
    text: String,
    language: String,
    version: String
});

const pokemonSchema = mongoose.Schema({
    idPokemon: Number,
    name: String,
    description: descriptionSchema,
    type: [String],
    evolveFrom: String,
    evolveTo: [String],
    sprite: String,
    artwork: String,
})

const Pokemon = mongoose.model('pokemons', pokemonSchema);

module.exports = Pokemon;