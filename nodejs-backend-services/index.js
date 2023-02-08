//initialize express app
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const isTripFeasible = require('./feasibility');
const predict = require('./predictions');
const processNLP = require('./processnlp');
const SerpAPIKeys = require('./SerpApiKeys');

const { Configuration, OpenAIApi } = require("openai");


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.get('/feasibility', async (req, res) => {
    const budget = req.query.budget;
    const number_of_people = req.query.number_of_people;
    const num_days = req.query.num_days;
    const city1 = req.query.city1;
    const city2 = req.query.city2;
    const feasibility = await isTripFeasible(budget, number_of_people, num_days, city1, city2);
    res.send(feasibility);

});

app.get('/predict', async (req, res) => {
    try{
        const text = req.query.text;
        const prediction = await predict(text);
        console.log(prediction);
        //send response with status 200
        res.status(200).send(prediction);

    }catch(err){
        console.log(err);
        res.status(500).send(err);
    }
});

// create serpapi passthrough
app.get('/fetchevents', async (req, res) => {
    // example: https://serpapi.com/search.json?engine=google_events&q=${query}&api_key=${key}
    const query = req.query.query;
    //randomly select key
    const key = SerpAPIKeys[Math.floor(Math.random() * SerpAPIKeys.length)];
    const url = `https://serpapi.com/search.json?engine=google_events&q=${query}&api_key=${key}`;
    const response = await fetch(url);
    const data = await response.json();
    res.send(data);
    
});
//
//

const openai_keys = [
    'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
]

app.get('/generatetrip', async (req, res) => {
    try{
        
        const configuration = new Configuration({
          apiKey: openai_keys[Math.floor(Math.random() * openai_keys.length)]
        });
        const openai = new OpenAIApi(configuration);
        const text = req.query.text;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: text,
            temperature: 0.3,
            max_tokens: 2984,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });
         
          const textData = response.data.choices[0].text;
          console.log(textData);
          res.status(200).send(textData);
        //res.status(200).send(response);

    }
    catch(err){
        console.log(err);
        try{
            
            const configuration = new Configuration({
              apiKey: openai_keys[0]
            });
            const openai = new OpenAIApi(configuration);
            const text = req.query.text;
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: text,
                temperature: 0.3,
                max_tokens: 2984,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
              });
             
              const textData = response.data.choices[0].text;
              console.log(textData);
              res.status(200).send(textData);
        }
        catch(err){
            try{
            
            const configuration = new Configuration({
              apiKey: openai_keys[1]
            });
            const openai = new OpenAIApi(configuration);
            const text = req.query.text;
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: text,
                temperature: 0.3,
                max_tokens: 2984,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
              });
             
              const textData = response.data.choices[0].text;
              console.log(textData);
              res.status(200).send(textData);
            }
            catch{
                res.status(200).send("Sorry, OPENAI API is down. Please try again later.")
            }
        }
    }
});
    



app.listen(3000, () => {
    console.log('Example app listening on the port 3000!');
}
);

