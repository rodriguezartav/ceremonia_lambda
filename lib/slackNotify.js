
var path = require("path");
var q = require( path.resolve(process.cwd(), "node_modules" ,"q") );
var jsforce = require( path.resolve(process.cwd(), "node_modules" ,"jsforce") );
var request = require(path.resolve(process.cwd(), "node_modules" ,"superagent") );
var querystring  = require(path.resolve(process.cwd(), "node_modules" ,"querystring") );
var UltraSES = require(path.resolve(process.cwd(), "node_modules" ,"ultrases") );

var mailer = new UltraSES({
  sdk: AWS,
  defaults: { from: 'Rodco Lambda <lambda@rodcocr.com>' }
});


function simple(text, channel){

  if(!channel) channel = "#servidores";
  return api( {
    username: "Rodbot",
    icon_emoji: ":robot_face:",
    channel: channel,
    text: text
  })

}

function api(body, forceSend){
  var deferred = Q.defer();
   body.link_names = true;
  console.log("Notifying Slack");
  request.post("https://slack.com/api/chat.postMessage?token=xoxp-3840399956-3845072824-15356795639-95ca8a73f3")
  .send( querystring.stringify( body ) )
  .end( function(err, res){
    if(err || res.body.ok == false ){
      sendByEmail(JSON.stringify(body), JSON.stringify(res.body), deferred);
      return deferred.reject( new Error(res.text ) );
    }

    return deferred.resolve();
  });

  return deferred.promise;
}

function sendByEmail(message, slackError, deferred){

  var message = {

    "text": "Hola Roberto y Esteban,\n\nTenemos un Error en Lambda, no lo pudimos publicar en Slack. \n\nError: " + message + "\n\nError en Slack: " + slackError,
    "subject": "Error de Rodco Diario Error enviando por Slack #" + Math.random() * 10000,
    "from_email": "rodcodiario@rodcocr.com",
    "from_name": "Rodco Diario",
    "to": [{
            "email": "roberto@rodcocr.com",
            "name": "Roberto Rodriguez",
            "type": "to"
        },
        {
            "email": "esteban@rodcocr.com",
            "name": "Roberto Rodriguez",
            "type": "to"
        }
        ],
    "headers": {
        "Reply-To": "roberto@rodcocr.com"
    },
    "important": true
  };



  mandrill_client.messages.send({"message": message}, function(result) {
    deferred.resolve();
  }, function(e) {
    console.log('ERROR H12 - A mandrill error occurred: ' + e.name + ' - ' + e.message);
    deferred.reject(e);
  });

}

//No se si mejor enviar a Slack - *TODO*
function sendNotification(message, slackError, deferred){
  var email = {to: 'it@rodcocr.com', subject: "Error de Rodco Diario Error enviando por Slack #" + Math.random() * 10000};
  var text = "Hola Roberto y Esteban,\n\nTenemos un Error en Lambda, no lo pudimos publicar en Slack. \n\nError: " + message + "\n\nError en Slack: " + slackError;

  mailer.sendText(email, text , function(err,res){
    return callback(err,res);
  })
}


module.exports = {
  simple: simple,
  api: api
}
