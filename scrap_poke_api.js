require('dotenv').config();
require('./models/connection');
const Pokemon = require('./models/pokemons');
const fetch = require('node-fetch');

function fetchData(url) {
    return fetch(url).then(response => response.json())
        .then(data => data);
}

function fetchPokemonFromSpecy(specy) {
    for (let variety of specy.varieties) {
        if (variety.is_default) {
            return fetch(variety.pokemon.url).then(response => response.json())
                .then(data => data);
        }
    }
}

function fetchChainFromSpecy(specy) {
    return fetch(specy.evolution_chain.url)
        .then(response => response.json())
        .then(data => {
            const chain = [];
            chain.push([data.chain.species.name.toLowerCase()]);

            let nextStage = data.chain.evolves_to;

            while (nextStage.length > 0) {
                let currentStage = [];
                for (let evolve of nextStage) {
                    currentStage.push(evolve.species.name.toLowerCase());
                }
                chain.push(currentStage);
                nextStage = nextStage[0].evolves_to;
            }

            return chain;
        });
}

const scrapAPIPokemon = async function() {
    const speciesList = await fetchData('https://pokeapi.co/api/v2/pokemon-species?limit=151&offset=0');

    for (const specy of speciesList.results) {
        const pokemons = await Pokemon.find();
        const specyData = await fetchData(specy.url);
        let idPokemon = specyData.id;
        let name = specyData.name[0].toUpperCase() + specyData.name.slice(1);

        if (!pokemons.some(p => p.name === name)) {
            const pokemonData = await fetchPokemonFromSpecy(specyData);
            const chainData = await fetchChainFromSpecy(specyData);
            
            let description = {
                text: specyData.flavor_text_entries[0].flavor_text.replace(/\n|\f/g,' '),
                language: specyData.flavor_text_entries[0].language.name,
                version: specyData.flavor_text_entries[0].version.name
            };

            const descriptionData = specyData.flavor_text_entries.find(desc => desc.language.name === 'en');
            !!descriptionData && (description = {
                text: descriptionData.flavor_text.replace(/\n|\f/g,' '),
                language: descriptionData.language.name,
                version: descriptionData.version.name
            });

            let type = [pokemonData.types[0].type.name];
            let evolveFrom = null;
            let evolveTo = null;
            let sprite = pokemonData.sprites.front_default;
            let artwork = pokemonData.sprites.other["official-artwork"].front_default || null;
    
            if (specyData.evolves_from_species) evolveFrom = specyData.evolves_from_species.name;
    
            for (let i = 0; i < chainData.length - 1; i++) {
                if (chainData[i].includes(name.toLowerCase())) {
                    evolveTo = chainData[i+1];
                    break;
                }
            }
    
            if (pokemonData.types.length >= 2) {
                type.push(pokemonData.types[1].type.name);
            }
    
            const newPokemon = new Pokemon({
                idPokemon,
                name,
                description,
                type,
                evolveFrom,
                evolveTo,
                sprite,
                artwork
            });
    
            await newPokemon.save();
            console.log(`${name} added`);
        } else console.log(`${name} already in database`);
    }

    console.log('-----------------END-----------------');
}

scrapAPIPokemon();
