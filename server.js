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
      var Id = crypto.randomBytes(32).toString('hex');
      var PubId = crypto.randomBytes(32).toString('hex');
      var wallet = {'name':name, 'Id':Id, 'PubId':PubId, 'socket':socket, 'amount':20.0};
      var contact = {'name':name,'PubId':PubId};
      contactList.push(contact);
      usersList.push(wallet);
      socket.emit('Id', Id,PubId);
      socket.emit('ContactList', contactList);
      socket.emit('UpdateWallet', wallet['amount'])
      io.emit('Addcontact',contact);
  
  });

  //If the user is not new then look for Wallet and set socket
  socket.on('AlreadyUser', function(id){
    try{
    findbyPrivateID(id)['socket'] = socket;
    } catch(error){
      io.sockets.emit('refresh');
      return; 
    }
    socket.emit('UpdateWallet', findbyPrivateID(id)['amount']);
    socket.emit('ContactList', contactList);
  });

  socket.on('shareMoney', function(Id, PubId, Amount){
    var ret = transferMoney(Id, PubId, Amount);
    if(ret['status'] == 'Failed'){
      io.sockets.emit('MoneyReturn', ret);
      console.log('Failed Trainsaction')
    }else{
      io.sockets.emit('MoneyReturn', ret);
      var reci = findbyPublicID(PubId);
      reci['socket'].emit('UpdateWallet',reci['amount']);
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

  if(Amount < 0){
    return {'status':'Failed', 'reason':"can't be less then zero"};
  }
  if(usersList[sender]['amount'] < Amount){
    return {'status':'Failed', 'reason':"Insufficent funds"};
  }

  usersList[sender]['amount'] = parseFloat(usersList[sender]['amount']) - parseFloat(Amount);
  usersList[reciver]['amount'] = parseFloat(usersList[reciver]['amount']) + parseFloat(Amount);


  console.log("Sender("+usersList[sender]['name']+"):"+usersList[sender]['amount'] + " => Receiver("+usersList[reciver]['name']+"):"+usersList[reciver]['amount']);
  return {'status':'Success','amount':usersList[sender]['amount']};

  
}
