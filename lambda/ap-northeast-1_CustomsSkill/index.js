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
            CustomsIntentHandler,
            CancelAndStopIntentHandler,
            HelpIntentHandler,
            SessionEndedRequestHandler
        )
        .withTableName('CustomsTable')
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
        let PersistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

            //2回目以降の起動
        let LaunchSpeech = 'はい！！！習慣チェッカーです！また来てくれてありがとう！';
        let DescriptionSpeech = '習慣を行なってからどれくらいたっているかを聞けます。';
        let AskSpeech = '聞きたい習慣は何ですか？掃除や洗濯のように言ってください！';

        if(!PersistentAttributes.count){
            //初回起動時のスキルの説明
            LaunchSpeech = '初めまして！習慣チェッカーです。これからよろしくお願いします！';
            DescriptionSpeech = 'このスキルは掃除や洗濯などの習慣を登録すると、前回その習慣を行なってから何日経っているかを聞くことができます。';
            AskSpeech = 'あなたは初めてのご利用ですね。記念すべき１つ目の習慣を登録しましょう！今日行なった習慣を、掃除や洗濯、美容室のように言ってください！';
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
        const now = moment().format("YYYY-MM-DD");
        const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        console.log(SessionAttributes.custom);

        let PersistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        PersistentAttributes[SessionAttributes.custom] = now;
        handlerInput.attributesManager.setPersistentAttributes(PersistentAttributes);
        await handlerInput.attributesManager.savePersistentAttributes();

        const YesSpeech = '素晴らしい！！これからも続けて行なって行きましょう！';

        return handlerInput.responseBuilder
            .speak(YesSpeech)
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

        const NoSpeech = 'なんと言うことでしょう。習慣は続けるから習慣なのですよ？しっかりと行いましょう！';

        return handlerInput.responseBuilder
            .speak(NoSpeech)
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
        //スロットの取得
        const custom = handlerInput.requestEnvelope.request.intent.slots.customs.value;

        //セッションアトリビュートにcustomsの値を保存
        let SessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        SessionAttributes.custom = custom;
        handlerInput.attributesManager.setSessionAttributes(SessionAttributes);

        //DynamoDBに保存してある永続化情報を取得
        let PersistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        //現在の年月日の取得
        let now = moment().format("YYYY-MM-DD");
        let CustomsSpeech,GreatSpeech,AskSpeech,Speech;
        
        //返答の分岐
        if(PersistentAttributes.count){
            console.log('2回目以降です');
            //2回目以降
            if(PersistentAttributes[custom]){
                //登録済みの習慣だった場合
                console.log('登録済み');
                let TimeDiff = moment(now).diff(moment(PersistentAttributes[custom]), 'day');//timeとfromの差を日付の形で取得できる

                CustomsSpeech = custom + 'を前回行なった日は'+ PersistentAttributes[custom] + 'で、前回行なってから' + TimeDiff + '日間、経過しています。';

                AskSpeech = '今日は' + custom + 'を行ないましたか？';

                Speech = CustomsSpeech + AskSpeech;

                return handlerInput.responseBuilder
                .speak(Speech)
                .reprompt(AskSpeech)
                .getResponse();
                
            }else{
                //初めての習慣だった場合
                console.log('登録します');

                CustomsSpeech = custom + 'は初めての習慣ですね。登録しました。習慣を続けて私とあなたでより良い生活にしていきましょう！';

                PersistentAttributes[custom] = now;
                handlerInput.attributesManager.setPersistentAttributes(PersistentAttributes);
                await handlerInput.attributesManager.savePersistentAttributes();

                return handlerInput.responseBuilder
                .speak(CustomsSpeech)
                .getResponse();
            }            

        }else{
            console.log('初回です');
            //初回
            PersistentAttributes[custom] = now;

            PersistentAttributes.count = 1;

            CustomsSpeech = '今日行なった習慣は' + custom + 'ですね。登録しました。';
            GreatSpeech = '次回からは習慣を言うと前回その習慣を行なってから何日たったかを聞くことができます。また初めての習慣を言うとその習慣を登録できます。';
            AskSpeech = '私とあなたでより良い生活にしていきましょう！';

            handlerInput.attributesManager.setPersistentAttributes(PersistentAttributes);
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
        const HelpSpeech = '習慣チェッカーは登録した習慣を前に行った日から何日経過しているかを聞くことができるスキルです。' 
                        + '初回は習慣の登録を行います。2回目からは新しい習慣を言うと登録、登録してある習慣を言うと何日経過しているかを聞くことができます。';
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