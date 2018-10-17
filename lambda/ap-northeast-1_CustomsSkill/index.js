'use strict'
const Alexa = require('ask-sdk');
var moment = require('moment');
require('date-utils');

 
let skill;
exports.handler = async function (event, context) {
    if (!skill) {
      skill = Alexa.SkillBuilders.standard()
        .addRequestHandlers(
            LaunchRequestHandler,
            YesIntentHandler,
            NoIntentHandler,
            HelpIntentHandler,
            CancelAndStopIntentHandler,
            CustomsIntentHandler,
            SessionEndedRequestHandler
        )
        .withTableName("Name_Table")
        .withAutoCreateTable(true)
        .addErrorHandlers(ErrorHandler)
        .create();
    }
    return skill.invoke(event);
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },

     async handle(handlerInput) {
        let attributes = await handlerInput.attributesManager.getPersistentAttributes();
        let LaunchSpeech,DescriptionSpeech,AskSpeech;

        if(attributes == true){
            //2回目以降の起動
            LaunchSpeech = '習慣チェッカーです！また来てくれてありがとう！';
            DescriptionSpeech = '習慣を行なってからどれくらいたっっているかを聞けるよ。';
            AskSpeech = '今日は行なった習慣は何ですか？洗濯や掃除、筋トレのように言っててください！';
        }else{
            //初回起動時のスキルの説明
            LaunchSpeech = '初めまして！習慣チェッカーです。これからよろしくお願いします！';
            DescriptionSpeech = 'このスキルは掃除や洗濯などの習慣を登録すると、前回その習慣を行なってから何日経っているかを知ることができます。';
            AskSpeech = 'あなたは初めての利用ですね。記念すべき１つ目の習慣にしたいことを洗濯や掃除、筋トレのように言っててください！';
        }

        const Speech = LaunchSpeech + DescriptionSpeech + AskSpeech;

        return handlerInput.responseBuilder
            .speak(Speech)
            .reprompt(AskSpeech)
            .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return  request.type === 'IntentRequest'
        &&      request.intent.name === 'AMAZON.YesIntent';
    },

    async handle(handlerInput){
        await handlerInput.attributesManager.savePersistentAttributes();

        const YesSpeechpeech = '素晴らしいですね！！';
        const AskSpeech = '他に聞きたい習慣を言ってください。'

        const Speech = YesSpeechpeech + AskSpeech;

        return handlerInput.responseBuilder
            .speak(Speech)
            .reprompt(AskSpeech)
            .getResponse();
    }
};

const NoIntentHandler = {
    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return  request.type === 'IntentRequest'
        &&      request.intent.name === 'AMAZON.NoIntent';
    },

    async handle(handlerInput){

        const NoSpeechpeech = '頑張って習慣にしましょう！！';
        const AskSpeech = '他に聞きたい習慣を言ってください。'

        const Speech = NoSpeechpeech + AskSpeech;

        return handlerInput.responseBuilder
            .speak(Speech)
            .reprompt(AskSpeech)
            .getResponse();
    }
};

const CustomsIntentHandler = {
    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return  request.type === 'IntentRequest'
        &&      request.intent.name === 'CustomsIntent';
    },

    async handle(handlerInput){
        const custom = handlerInput.requestEnvelope.request.intent.slots.customs.value;

        let i;
        let attributes = await handlerInput.attributesManager.getPersistentAttributes();
        let time = moment().format("YYYY/MM/DD");
        let date = new Date(time);
        
        console.log(time);
        console.log(date);

        

        

    

        return handlerInput.responseBuilder
            .speak(Speech)
            .reprompt(AskSpeech)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return  request.type === 'IntentRequest'
        &&      request.intent.name === 'AMAZON.HelpIntent';
    },

    handle(handlerInput) {
        const HelpSpeech = '前に行った習慣から何日経ったかを確認できます。';
        const AskSpeech = '聞きたい習慣は何ですか？';

        const speech = HelpSpeech + AskSpeech;

        return handlerInput.responseBuilder
            .speak(speech)
            .reprompt(AskSpeech)
            .getResponse();
    }

};

const CancelAndStopIntentHandler = {

    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;
    
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.StopIntent'
            ||  request.intent.name === 'AMAZON.CancelIntent'
            ||  request.intent.name === 'Amazon.NoIntent');
        },
    
    handle(handlerInput){
        const speech = 'わかりました、終了します。';
        return handlerInput.responseBuilder
            .speak(speech)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle(handlerInput, error) {
        return true;
    },
    handle(handlerInput, error) {
        return handlerInput.responseBuilder
            .speak('うまくいきませんでした、ごめんなさい。')
            .getResponse();
    }
}