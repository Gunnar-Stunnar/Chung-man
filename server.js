var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crypto = require('crypto'); 

app.use(express.static("client/content/js"));
app.use(express.static("client/content/style"));

app.get('/', function(req, res){
  res.sendFile(__dirname + "/client/index.html");
});

var port = process.env.PORT || 3000;


var server = http.listen(port, function(){
  console.log('listening on port ' + port);
});



io.on('connection', function(socket){

  //If the user is new then generate Id and PubId
  socket.on('newUser', function(name){
    crypto.randomBytes(64, function(ex, buf) {
      if (ex) throw ex;
      var Id = buf.toString('hex');
      var PubId = buf.toString('hex');
      var wallet = {'name':name, 'Id':Id, 'PubId':PubId, 'socket':socket, 'amount':0.0};
      var contact = {'name':name,'PubId':PubId};
      contactList.push(contact);
      usersList.push(wallet);
      socket.emit('ContactList', contactList);
      socket.emit('Id', Id,PubId);
      socket.emit('Addcontact',contact);
      });
  });

  //If the user is not new then look for Wallet and set socket
  socket.on('AlreadyUser', function(id){
    findbyPrivateID(id)['socket'] = socket;
    socket.emit('ContactList', contactList);
  });

  socket.on('shareMoney', function(Id, PubId, Amount){
    var ret = transferMoney(Id, PubId, Amount);
    if(ret['status'] === 'Failed'){
      io.sockets.emit('MoneyReturn', ret);
    }else{
      io.sockets.emit('MoneyReturn', ret);
      var reci = findbyPublicID(PubId);
      reci['socket'].emit('MoneyUpdate',reci['amount']);
    }

  });


});

//Wallet is scturctured like this
/*{
  name: *name of the person *,
  Id: *Private ID*,
  PubId: *Public ID*,
  socket: *socket the user is on*,
  amount: *amount in the wallet*
}*/

var usersList = [];
var contactList = [];

function findbyPublicID(id){
    return usersList.find(x => x.PubId === id);
}
function findbyPrivateID(id){
    return usersList.find(x => x.Id === id);
}

function transferMoney(Id, PubId, Amount){
  var sender = usersList.findIndex(x => x.Id === Id);
  var reciver = usersList.findIndex(x=> x.PubId === PubId);
  console.log("" + sender + "" + reciver);

  if(Amount < 0){
    return {'status':'Failed', 'reason':"can't be less then zero"};
  }
  if(usersList[sender]['amount'] < Amount){
    return {'status':'Failed', 'reason':"Insufficent funds"};
  }
  usersList[sender]['amount'] = usersList[sender]['amount'] - Amount;
  usersList[reciver]['amount'] = usersList[sender]['amount'] + Amount;

  return {'status':'Success','amount':usersList[sender]['amount']};
}
