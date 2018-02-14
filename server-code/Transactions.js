

module.exports = function TransferCurrency(taker, giver, amount){
  if(giver.getAmount <= amount){
    return {transfer:false, amount:0.0};
  }else{
    taker.addCurrency(amount);
    giver.subtractCurrency(amount);
    return {transfer:true, amount:0.0};
  }

}
