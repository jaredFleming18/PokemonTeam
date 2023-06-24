process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    console.error("Usage supermarketServer.js portNumber");
    process.exit(1);
}
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.dfdt4v2.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const portNumber = process.argv[2];

const fs = require("fs");
const http = require("http");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser");
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use('/templates', express.static('templates'));
async function getData(name) {
    let url = "https://pokeapi.co/api/v2/pokemon/"
    url = url + name
    const response = await fetch(url);
    const result = await (response.text());
    let obj = JSON.parse(result)
    return obj;
}
app.get("/", (request, response) => {
    response.render("index");
});
app.get("/create", (request, response) => {
    const variables = {
        form: `<form action=\"http://localhost:${portNumber}/processCreate\" style="margin-left: 20px; margin-bottom: 10px;" method=\"post\">`,
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    response.render("create", variables);
});
app.use(bodyParser.urlencoded({extended:false}));
app.post("/processCreate", (request, response) => {
    const variables = {
        name: request.body.name,
        pokemon1: request.body.pokemon1.toLowerCase(),
        pokemon2: request.body.pokemon2.toLowerCase(),
        pokemon3: request.body.pokemon3.toLowerCase(),
        pokemon4: request.body.pokemon4.toLowerCase(),
        pokemon5: request.body.pokemon5.toLowerCase(),
        pokemon6: request.body.pokemon6.toLowerCase(),
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    
    async function main() {
        try {
            await client.connect();
            await insertTeam(client, databaseAndCollection, variables);
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }
    
    async function insertTeam(client, databaseAndCollection, applicant) {
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(applicant);
    }
    main().catch(console.error);

    response.render("processCreate", variables);
});
app.get("/view", (request, response) => {
    const variables = {
        form: `<form action=\"http://localhost:${portNumber}/processView\" style="margin-left: 20px; margin-bottom: 10px;" method=\"post\">`,
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    response.render("view", variables);
});
app.post("/processView", (request, response) => {
    let variables = {
        name: request.body.name,
        pokemon1: undefined,
        type1: undefined,
        pokemon2: undefined,
        type2: undefined,
        pokemon3: undefined,
        type3: undefined,
        pokemon4: undefined,
        type4: undefined,
        pokemon5: undefined,
        type5: undefined,
        pokemon6: undefined,
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    async function main() {
        try {
            await client.connect();
            let result = await lookUpOneEntry(client, databaseAndCollection, request.body.name);
            variables.pokemon1 = result.pokemon1
            variables.pokemon2 = result.pokemon2
            variables.pokemon3 = result.pokemon3
            variables.pokemon4 = result.pokemon4
            variables.pokemon5 = result.pokemon5
            variables.pokemon6 = result.pokemon6
            async function sendData () {
                try {
                    let names = [variables.pokemon1, variables.pokemon2, variables.pokemon3, variables.pokemon4,variables.pokemon5,variables.pokemon6]
                    const pokeObj1 = await getData(names[0]);
                    const pokeObj2 = await getData(names[1]);
                    const pokeObj3 = await getData(names[2]);
                    const pokeObj4 = await getData(names[3]);
                    const pokeObj5 = await getData(names[4]);
                    const pokeObj6 = await getData(names[5]);
                    variables.type1 = getType (pokeObj1)
                    variables.type2 = getType (pokeObj2)
                    variables.type3 = getType (pokeObj3)
                    variables.type4 = getType (pokeObj4)
                    variables.type5 = getType (pokeObj5)
                    variables.type6 = getType (pokeObj6)
                    function getType (obj) {
                        let string = obj.types[0].type.name
                        if (obj.types.length > 1) {
                            string += "/" + obj.types[1].type.name
                        }
                        return string
                    }
                    response.render("processView", variables);
                } catch (error) {
                    console.error(error);
                }
            }
            sendData()
            
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }
    async function lookUpOneEntry(client, databaseAndCollection, name) {
        let filter = {name: name};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
        return result
    }
    main().catch(console.error);
});
app.get("/pokedex",  (request, response) => {
    const variables = {
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    response.render("pokedex", variables)
});
app.get("/battle", (request, response) => {
    const variables = {
        form: `<form action=\"http://localhost:${portNumber}/processBattle\" style="margin-left: 20px; margin-bottom: 10px;" method=\"post\">`,
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`
    };
    response.render("battle", variables);
});
app.post("/processBattle", (request, response) => {
    const variables = {
        home: `<a href=\"http://localhost:${portNumber}\">HOME</a>`,
        image1: undefined,
        image2: undefined,
        winner: undefined,
        pokemon1: request.body.pokemon1.toUpperCase(),
        pokemon2: request.body.pokemon2.toUpperCase()
    };
    let pokemon1 = request.body.pokemon1.toLowerCase()
    let pokemon2 = request.body.pokemon2.toLowerCase()
    async function sendData () {
        try {
            const pokeObj1 = await getData(pokemon1);
            const pokeObj2 = await getData(pokemon2);
            variables.image1 = `<img src = ${pokeObj1.sprites.front_shiny} id = \"image1\">`
            variables.image2 = `<img src = ${pokeObj2.sprites.front_shiny} id = \"image1\">`
            variables.background = `<img src = \"https://wallpapers.com/wallpapers/pokemon-stadium-1920-x-1080-wallpaper-dqqp686gjn57ka0u.html?embed=true\">`
            if (Math.floor(Math.random() * 10) >= 4) {
                variables.winner = pokemon1.toUpperCase()
            }
            else {
                variables.winner = pokemon2.toUpperCase()
            }
            response.render("processBattle", variables);
        } catch (error) {
            console.error(error);
        }
    }
    sendData()
});
app.listen(portNumber);
const prompt = `Stop to shutdown the server: `;
process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        }
        process.stdin.resume();
    }
});

