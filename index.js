// var AWS = require('aws-sdk');

exports.handler = function( event, context ) {
    var say = "";
    var endsession = false;
    var sessionAttributes = {};
    var delay=1000;
    var bpm=60;

    if (event.session.attributes) {
        sessionAttributes = event.session.attributes;
    }

    if (event.request.type === "LaunchRequest") {
        say = "I'm a metronome, how many beats per minute?";

    } else {
        var IntentName = event.request.intent.name;

        if (IntentName === "BeatIntent") {

            if(event.request.intent.slots.BPM.value) {
                bpm=event.request.intent.slots.BPM.value;
               sessionAttributes.BPM=bpm;
                

                say = "Ok, you want "+bpm+"?";

            } else {
                say = "I couldn't get that. At what speed would you like?";
            }

        }
        else if (IntentName === "cIntent") {
            var res="";
            if(!sessionAttributes.BPM){
                sessionAttributes.BPM=60;
                say="Something went wrong. Playing you a metronome at sixty beats per minute."
                for(var i=1; i<50; i++){
                res=res+'<break time="'+(bpm/60)+'s"/><phoneme alphabet="ipa" ph="k">k</phoneme>';
                }
             say=res;
            }
            else{
            bpm=sessionAttributes.BPM;
            
            for(var j=1; j<50; j++){
                res=res+'<break time="'+(bpm/60)+'s"/><phoneme alphabet="ipa" ph="k">k</phoneme>';
             }
             say=res;
            }
        }   
        
        else if (IntentName === "EndIntent") {
            say = "Goodbye!";
            endsession = true;

        }
    }

    var response = {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + say + "</speak>"
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>Please try again. " + say + "</speak>"
            }
        },
        card: {
            type: "Simple",
            title: "My Card Title",
            content: "My Card Content, displayed on the Alexa Companion mobile App or alexa.amazon.com"
        },

        shouldEndSession: endsession
    };



    Respond(  // Respond with normal speech only
        function() {context.succeed( {sessionAttributes: sessionAttributes, response: response } ); }
    );


    // --------- Uncomment for AWS SQS Integration -------------------------------------------------
    //RespondSendSqsMessage(  // use this to send a new message to an SQS Queue
    //    {
    //        MessageBody:  "https://www.google.com/search?tbm=isch&q=" + myColor + "%20" + myAnimal  // Message Body (Image Search URL)
    //    },
    //     function() {context.succeed( {sessionAttributes: sessionAttributes, response: response } ); }
    //);


    // --------- Uncomment for AWS IOT Integration -------------------------------------------------
    //RespondUpdateIotShadow(  // use this to update an IoT device state
    //    {
    //        IOT_THING_NAME: "MyDevice",
    //        IOT_DESIRED_STATE: {"pump":1}  // or send spoken slot value detected
    //    },
    //    function() {context.succeed( {sessionAttributes: sessionAttributes, response: response } ); }
    //);


};

// -----------------------------------------------------------------------------

function Respond(callback) {
    callback();
}

function RespondSendSqsMessage(sqs_params, callback) {

    sqs_params.QueueUrl = "https://sqs.us-east-1.amazonaws.com/333304289684/AlexaQueue";

    var sqs = new AWS.SQS({region : 'us-east-1'});


    sqs.sendMessage(sqs_params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log("success calling sqs sendMessage");

            callback();  // after performing SQS send, execute the caller's context.succeed function to complete
        }
    });

}


function RespondUpdateIotShadow(iot_config, callback) {

    iot_config.IOT_BROKER_ENDPOINT      = "https://A2ESHRCP6U0Y0C.iot.us-east-1.amazonaws.com".toLowerCase();
    iot_config.IOT_BROKER_REGION       = "us-east-1";


    var iotData = new AWS.IotData({endpoint: iot_config.IOT_BROKER_ENDPOINT});

    //Set the pump to 1 for activation on the device
    var payloadObj={ "state":
    { "desired":
    iot_config.IOT_DESIRED_STATE // {"pump":1}
    }
    };

    //Prepare the parameters of the update call
    var paramsUpdate = {
        "thingName" : iot_config.IOT_THING_NAME,
        "payload" : JSON.stringify(payloadObj)
    };
    // see results in IoT console, MQTT client tab, subscribe to $aws/things/YourDevice/shadow/update/delta

    //Update Device Shadow
    iotData.updateThingShadow(paramsUpdate, function(err, data) {
        if (err){
            console.log(err.toString());
        }
        else {
            console.log("success calling IoT updateThingShadow");
            callback();  // after performing Iot action, execute the caller's context.succeed function to complete
        }
    });



}