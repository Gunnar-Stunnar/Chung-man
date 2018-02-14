module.exports.Wallet = class Wallet {

  constructor(name, id){
    this.amount = 0.0;
    this.name = name;
    this.id = id;
  }

  addCurrency(amount){
    this.amount += amount;
  }

  subtractCurrency(amount){
    this.amount -= amount;
  }

  get Amount(){
    return this.amount;
  }

  get Name(){
    return this.name;
  }

  get id(){
    return this.id;
  }
}


var usersList = []

exports.usersList = usersList;

exports.findById = function findById(id) {
  usersList.find(x => x.id == id);
}
