var express = require('express');
var router = express.Router();
const Pokemon = require('../models/pokemons');

// get with query option ?
// name to search for name
// id to search for idPokemon
// fromId & toId to search for a range
// if none, find all pokemons
router.get('/', async (req, res) => {
    const { name, id, fromId, toId } = req.query;

    const pokemons = await Pokemon.find({
        $or: [
            { idPokemon: +id || 0 },
            { idPokemon: {$gte: +fromId||0, $lte: +toId||Number.MAX_VALUE }},
            { name: { $regex: new RegExp(`^${name||''}$`, "i") } }
        ]
    });

    const length = pokemons.length;

    if (length > 0) res.json({ result: true, length, pokemons });
    else res.json({ result: false, error: "Pokemon not found" });
});

module.exports = router;