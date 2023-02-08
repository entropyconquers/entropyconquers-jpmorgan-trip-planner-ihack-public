const predict = require('./predictions');

const processNLP = async (text) => {
    let out = text + "\n";
    out +=  'schema={\n'+
    '      total_budget: TYPE (required): (Number | null if not available),\n'+
    '      origin: TYPE (required) : (String, where the trip starts | null if not available),\n'+
    '      destination: TYPE (required) : (String, to where the trip is planned | null if not available),\n'+
    '      total_days: TYPE (required): (Number | null if not available),\n'+
    '      no_of_person (required): TYPE: Number,\n'+
    '      preferences: TYPE (optional): (Array of Strings),\n'+
    '      misc: TYPE (optional): (String, miscellaneous information),\n'+
    '      prompt: TYPE: (String, Output to ask to the user for parameters if some of the required parameters in the above schema are null),\n'+
    '      prompt_required: TYPE: (Boolean, false if all the required parameters are non null, true if some of the parameters are null)\n'+
    '    }\n'+
    '    Your response should only be in valid JSON format (using the above JSON schema), do not write any other extra text above or below the JSON (NO MARKDOWN ONLY PLAINTEXT)`\n'+
    '';
    return out;
}

module.exports = processNLP;