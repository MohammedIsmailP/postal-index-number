'use strict';

const {
    dialogflow,
    Suggestions,
} = require('actions-on-google');

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const Suggestion = {
    Chennai: '600001',
    Mumbai: '400001',
    Kolkata: '700001',
    Delhi: '110001',
}
const app = dialogflow({debug: true});

app.middleware((conv) => {
    if (!conv.data.fallbackCount || !(conv.intent === 'Fallback')) {
      conv.data.fallbackCount = 0;
    }
});

app.intent('Welcome', (conv) => {
    const welcomeMessage = 'Welcome to Indian Postal Index Number where ' +
        'you can get details of Postal number. Note that this support only for India. ' +
        'You can tell the postal code you want to get details of.';
    conv.ask(welcomeMessage);
    if (conv.screen) {
      conv.ask(new Suggestions([Suggestion.Chennai, Suggestion.Mumbai,
        Suggestion.Kolkata, Suggestion.Delhi]));
    }
});

app.intent(['Quit','PIN number - no'], (conv) => {
    conv.close('Thanks for using Indian Postal Index Number. See you soon!!');
});

app.intent('PIN number', (conv,{number}) => {
    const pin = number;
    var url = `https://api.postalpincode.in/pincode/${pin}`;
    var req = require('sync-request');
    var res = req('GET', url);
    var jsonfile = res.body.toString('utf-8');
    var objArray = JSON.parse(jsonfile)
    const audioSound = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
    if (pin.toString().length !== 6) {
        conv.ask(`<speak>You have entered ${pin}.<audio src = "${audioSound}"></audio> Please enter 6 digit postal code.</speak>`);
    }
    else if (objArray[0].Status === "Error")
        conv.ask(`<speak>Incorrect postal number ${pin}.<audio src = "${audioSound}"></audio></speak>`);
    else
    {
        var place = ``;
        for(n in objArray[0].PostOffice)
            place += objArray[0].PostOffice[n].Name + ', ';
        conv.ask(`The postal number belongs to ${place} of ${objArray[0].PostOffice[0].District} district of ${objArray[0].PostOffice[0].State}`);
    }
    conv.ask("Do you want to know the details of another postal number?");
});

app.intent('PIN number - yes', (conv) => {
    const msg = 'Please tell the postal code'
    conv.ask(msg);
    if (conv.screen) {
        conv.ask(new Suggestions([Suggestion.Chennai, Suggestion.Mumbai,
          Suggestion.Kolkata, Suggestion.Delhi]));
    }  
});

app.intent('No Input', (conv) => {
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
      conv.ask(`Sorry, I can't hear you.`);
    } else if (repromptCount === 1) {
      conv.ask(`I'm sorry, I still can't hear you.`);
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
      conv.close(`I'm sorry, I'm having trouble here. ` +
        'Maybe we should try this again later.');
    }
});

app.intent('Fallback', (conv) => {
    conv.data.fallbackCount++;
    if (conv.data.fallbackCount === 1) {
      conv.ask('Sorry, what was that?');
    } else if (conv.data.fallbackCount === 2) {
      conv.ask(`I didn't quite get that. You can tell the postal code you want to get details of.`);
    } else {
      conv.close(`Sorry, I'm still having trouble. ` +
        `So let's stop here for now. Bye.`);
    }
});

exports.fulfillment = functions.https.onRequest(app);