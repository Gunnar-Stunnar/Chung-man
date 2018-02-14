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

var admin_path = "/"+crypto.randomBytes(32).toString('hex');
console.log(admin_path);
app.get(admin_path, function(req,res){
  res.sendFile(__dirname + "/client/admin.html")
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
      var wallet = {'name':name, 'Id':Id, 'PubId':PubId, 'socket':socket, 'amount':20.0, 'loan':0, 'time':'not work'};
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
      socket.emit('refresh');
      return; 
    }
    socket.emit('UpdateWallet', findbyPrivateID(id)['amount']);
    socket.emit('ContactList', contactList);
  });

  socket.on('shareMoney', function(Id, PubId, Amount){
    var ret = transferMoney(Id, PubId, Amount);
    if(ret['status'] == 'Failed'){
      socket.emit('MoneyReturn', ret);
      console.log('Failed Trainsaction')
      var sender = findbyPrivateID(Id);
      var reciver = findbyPublicID(PubId);
      reciver.emit('loan', reciver['loan'], 'not Working')
      sender.emit('loan', sender['loan'], 'not Working')
    }else{
      socket.emit('MoneyReturn', ret);
      var reci = findbyPublicID(PubId);
      reci['socket'].emit('UpdateWallet',reci['amount']);
    }

  });


});

var usersList = [];
var contactList = [];


var Bank = {'name':'Bank', 'Id':crypto.randomBytes(32).toString('hex'), 'PubId':'0', 'socket':'', 'amount':10000000, 'loan':0, 'time':'not work'};
console.log(Bank)

contactList.push({'name':'Bank','PubId':'0'});
usersList.push(Bank);

//Wallet is scturctured like this
/*{
  name: *name of the person *,
  Id: *Private ID*,
  PubId: *Public ID*,
  socket: *socket the user is on*,
  amount: *amount in the wallet*
}*/


function findbyPublicID(id){
    return usersList.find(x => x.PubId === id);
}
function findbyPrivateID(id){
    return usersList.find(x => x.Id === id);
}



function transferMoney(Id, PubId, Amount){
  var sender = usersList.findIndex(x => x.Id === Id);
  var reciver = usersList.findIndex(x=> x.PubId === PubId);

     //Establish loans 
     if(usersList[sender]['Id'] === Bank['Id']){
      usersList[reciver]['loan'] = (parseFloat(usersList[reciver]['loan']) + parseFloat(Amount))*1.08;
      console.log(usersList[reciver]['name'] + "-loan:" + usersList[reciver]['loan']);
    }
    if(usersList[reciver]['Id'] === Bank['Id']){
      if(usersList[sender]['loan'] >= Amount){
        usersList[reciver]['loan'] = (parseFloat(usersList[reciver]['loan']) - parseFloat(Amount));
        console.log(usersList[sender]['name'] + "-loan:" + usersList[reciver]['loan']); 
      }else{
        return {'status': 'Failed', 'reason': "More then needed to payoff"};
      }
    }

  if(Amount < 0){
    return {'status':'Failed', 'reason':"can't be less then zero"};
  }
  if(usersList[sender]['amount'] < 0){
    return {'status':'Failed', 'reason':"See IRS need to be Audit!"};
  }
  if(usersList[sender]['amount'] < Amount){
    return {'status':'Failed', 'reason':"Insufficent Funds!"};
  }

  usersList[sender]['amount'] = parseFloat(usersList[sender]['amount']) - parseFloat(Amount);
  usersList[reciver]['amount'] = parseFloat(usersList[reciver]['amount']) + parseFloat(Amount);

  console.log(usersList);

  console.log("Sender("+usersList[sender]['name']+"):"+usersList[sender]['amount'] + " => Receiver("+usersList[reciver]['name']+"):"+usersList[reciver]['amount']);
  return {'status':'Success','amount':usersList[sender]['amount']};

  
}
