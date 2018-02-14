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

    //If server restart happens
    socket.on('refresh',function(){
      Cookies.remove('Id');
      Cookies.remove('PubId');
      location.reload(true);
    });

    // Money transfer
    var selected = null;
    $(document).on('click touchstart', '#Others li', function(){
      if(selected != null){
        selected.css("background-color","transparent");
      }
      selected = $(this);
      selected.css("background-color","rgba(0,0,0,0.5)");
      $("#formName").html(selected.html());
    });

    //transfer money
    $("#TransButton").click(function(){
      if($('#amountInput').val() == ""){
        $('#amountInput').css('background-color','red');
      }else if(selected == null){
        $("#formName").css('background-color','red');
      }else{
        //if everything is filled in then call share money
        $('#amountInput').css('background-color','white');
        $("#formName").css('background-color','white');
        socket.emit('shareMoney',
          Cookies.get('Id'),
          contactList.find(x => x.name === selected.html())['PubId'],$('#amountInput').val());

          $('#amountInput').val('');
          $("#formName").html("");
          selected.css("background-color","transparent");
          selected = null;          
      }

    });

    //Server generates ID
    socket.on('Id',function(Id, PubId){
      Cookies.set('Id', Id);
      Cookies.set('PubId',PubId);
    });

    //Add contact
    socket.on('Addcontact', function(contact){
      if(contact['PubId'] !== Cookies.get('PubId')){
      contactList.push(contact);
      $("#Others").append('<li>'+contact['name']+'</li>');
      }
    });

    //Add the full list
    socket.on('ContactList', function(contacts){
      contactList = contacts;
      for(var i = 0; i < contacts.length; i++){
        if(contacts[i]['PubId'] !== Cookies.get('PubId')){
        $("#Others").append('<li>'+contacts[i]['name']+'</li>');
        }
      }
    });

    socket.on('MoneyReturn', function(ret){
        console.log(ret);
      if(ret['status'] === 'Failed'){
        $("#status").css('background-color','red');
        $("#status").html(ret['status'] + ":" + ret['reason']);
      }else {
        $("#status").css('background-color','green');
        $("#status").html('SUCCESS!')
        $("#currency").html('$'+ret['amount']);
      }
    });

    socket.on('UpdateWallet', function(amount){
      $("#currency").html('$'+amount);
    });

    //Loan updates
    socket.on('loan', function(loan,time){
      $("#loan").html("Loan: " + loan);
      $("#time").html("time: " + time);
    });


});
