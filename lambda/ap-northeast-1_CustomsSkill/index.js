'use strict'

const Alexa = require('ask-sdk');
var moment = require('moment');

 
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
        .withTableName('CustomsTable')
        .withAutoCreateTable(true)
        //.addErrorHandlers(ErrorHandler)
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

            //2回目以降の起動
        let LaunchSpeech = '習慣チェッカーです！また来てくれてありがとう！';
        let DescriptionSpeech = '習慣を行なってからどれくらいたっっているかを聞けます。';
        let AskSpeech = '今日は行なった習慣は何ですか？洗濯や掃除、筋トレのように言っててください！';

        if(!attributes.count){
            //初回起動時のスキルの説明
            LaunchSpeech = '初めまして！習慣チェッカーです。これからよろしくお願いします！';
            DescriptionSpeech = 'このスキルは掃除や洗濯などの習慣を登録すると、前回その習慣を行なってから何日経っているかを知ることができます。';
            AskSpeech = 'あなたは初めての利用ですね。記念すべき１つ目の習慣を登録しましょう！今日行った習慣を洗濯や掃除、筋トレのように言ってください！';
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
        //Dynamoに保存するkeyとvalueの再取得
        let now = moment().format("YYYY-MM-DD");
        let custom = handlerInput.attributesManager.getSessionAttributes().custom;
        attributes = {[custom]:now};
        handlerInput.attributesManager.setPersistentAttributes(attributes);
        await handlerInput.attributesManager.savePersistentAttributes();

        const YesSpeechpeech = '素晴らしいですね！！これからも続けて行きましょう！';
        const AskSpeech = '他に聞きたい習慣があれば洗濯や掃除、のように言ってください。'

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

        const NoSpeechpeech = 'なんと言うことでしょう。習慣は続けるから習慣なのですよ？しっかりと行いましょう！';
        const AskSpeech = '他に聞きたい習慣があれば洗濯や掃除、のように言ってください。'

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
        //スロットの取得,セッションに保存
        const custom = handlerInput.requestEnvelope.request.intent.slots.customs.value;
        handlerInput.attributesManager.setSessionAttributes({'custom': custom});

        let attributes = await handlerInput.attributesManager.getPersistentAttributes();

        let now = moment().format("YYYY-MM-DD");
        let CustomsSpeech,GreatSpeech,AskSpeech,Speech;
        
        if(attributes.count){
            console.log('2回目以降です');
            //2回目以降
            if(attributes[custom]){
                console.log('登録済み');
                let TimeDiff = moment(now).diff(moment(attributes[custom]), 'day');//timeとfromの差を日付の形で取得できる

                CustomsSpeech = custom + 'は前回行なった日から' + TimeDiff + '日経過しています。';
                
            }else{
                console.log('登録します');
                attributes = {[custom]:now};

                CustomsSpeech = custom + 'は初めての習慣ですね。登録しました。';
            }
            AskSpeech = '今日は行いましたか？';

            await handlerInput.attributesManager.setPersistentAttributes(attributes);
            Speech = CustomsSpeech + AskSpeech;

            return handlerInput.responseBuilder
            .speak(Speech)
            .reprompt(AskSpeech)
            .getResponse();            

        }else{
            console.log('初回です');
            //初回
            attributes = {[custom]:now};
            CustomsSpeech = '今日行った習慣は' + custom + 'ですね。登録しました。';
            GreatSpeech = '次回からは習慣を言うと前回その習慣を行ってから何日たったかを聞くことができます。また初めての習慣を言うとその習慣を登録できます。';
            AskSpeech = '私とあなたでより良い生活にしていきましょう！';

            attributes.count = 1;

            handlerInput.attributesManager.setPersistentAttributes(attributes);
            await handlerInput.attributesManager.savePersistentAttributes();

            const Speech = CustomsSpeech + GreatSpeech + AskSpeech;

            return handlerInput.responseBuilder
            .speak(Speech)
            .getResponse();

        }
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
            .speak('うまくいきませんでした、ごめんなさい。もう一度言ってください。')
            .reprompt('もう一度言ってください。')
            .getResponse();
    }
}