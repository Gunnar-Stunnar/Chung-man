$(document).ready(function () {
    var socket = io();
    var contactList = [];
    $("#bod").hide();

    //Entry point for the program if cookie is found
    if(typeof Cookies.get('Id') !== 'undefined' && typeof Cookies.get('PubId') !== 'undefined'){
      socket.emit('AlreadyUser',Cookies.get('Id'))
      $('#splashScreen').hide(0, function(){
        $("#bod").fadeIn();
    });
  }

  //Entry point of no cookie is found
    $("#start").click(function(){
      if($("#name").val() != ''){
      $('#splashScreen').fadeOut(1000, function(){
        $("#bod").fadeIn();
        socket.emit('newUser',$("#name").val());
      });
    }
    });

    // Money transfer
    var selected = null;
    $(document).on('click', '#Others li', function(){
      if(selected != null){
        selected.css("background-color","transparent");
      }
      selected = $(this);
      selected.css("background-color","rgba(0,0,0,0.5)");
      $("#formName").html(selected.html());
      console.log(contactList.find(x => x.name === selected.html()).PubId);
      console.log(selected.html());
    });

    //transfer money
    $("#TransButton").click(function(){
      if($('#amountInput').value == null){
        $('#amountInput').css('background-color','red');
      } if(selected == null){
        $("#formName").css('background-color','red');
      }else{
        //if everything is filled in then call share money
        $('#amountInput').css('background-color','white');
        $("#formName").css('background-color','white');
        console.log(contactList.find(x => x.name === selected.html())['PubId']);
        socket.emit('shareMoney',
          Cookies.get('Id'),
          contactList.find(x => x.name === selected.html())['PubId'],
          $('#amountInput').value);
      }

    });

    //Server generates ID
    socket.on('Id',function(Id, PubId){
      Cookies.set('Id', Id);
      Cookies.set('PubId',PubId);
    });

    //Add contact
    socket.on('Addcontact', function(contact){
      contactList.push(contact);
      $("#Others").append('<li><a>'+contact['name']+'</a></li>');
    });

    //Add the full list
    socket.on('ContactList', function(contacts){
      contactList = contacts;
      for(var i = 0; i < contacts.length; i++){
        $("#Others").append('<li>'+contacts[i]['name']+'</li>');
      }
    });

    socket.on('MoneyReturn', function(ret){
      if(ret['status'] === 'Failed'){
        $("#status").css('background-color','red');
        $("#status").html(ret['status'] + ":" + ret['reason']);
      }else {
        $("#status").css('background-color','green');
        $("#currency").html('$'+ret['amount']);
      }
    });




});
