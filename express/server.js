'use strict';
const {conversation, Card, Image} = require('@assistant/conversation');
const fetch = require('node-fetch').default;
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

const app = conversation({debug: false});

async function start_scene_initial_prompt( conv){
  console.log('Start scene: initial prompt');
  try{
    let lang = 'es';
    if( conv.user.locale && conv.user.locale.startsWith('en-')){
      lang = 'en';
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth()+1;
    const day = today.getDate();
    const url = `https://calendario-cientifico-escolar.github.io/data/json/${lang}/${year}/${month}/${day}.json`;

    const response = await fetch(url, { method: "Get" });
    const json = await response.json()  
    
    const diff = year - json.eventYear
    
    const intro = lang === 'es' ? `Tal día como hoy, hace ${diff} años, el ` : `${diff} years ago, in `
    const title = `<p><s>${json.title}</s></p>`
    const body = `${json.body}`

    console.log(`<speak>${intro}${title}<p><s>${body}</s></p></speak>`)
    conv.add( `<speak>${intro}${title}<p><s>${body}</s></p></speak>`);

    conv.add(new Image({
        url: json.image,
        alt: json.title,
    }));
    
    conv.overwrite = false;
    conv.scene.next.name = 'actions.scene.END_CONVERSATION';
  }catch(e){    
    console.log(e) 
  }
}

app.handle('start_scene_initial_prompt', (conv) => {
  return start_scene_initial_prompt(conv)
});

const expressApp = express().use(bodyParser.json());
expressApp.post('/.netlify/functions/server/webhook',app);

module.exports = expressApp;
module.exports.handler = serverless(expressApp);