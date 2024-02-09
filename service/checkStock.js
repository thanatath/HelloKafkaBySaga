const thisService = "checkStock";
require('../config/instrumentation.js')(thisService)
const { clientConsumer,clientProducer  } = require('../config/kafka.js')
const {topic} = require("../config/kafka.js");

// KafKa
const _clientConsumer = clientConsumer(thisService);

// Mock DataBase
var database = [
  {
    name:'watch',
    stock: 50,
  }
];

async function initialize() {
  await _clientConsumer.subscribe({topics: [topic.CHECK_STOCK,topic.PURCHASE_FAIL]});
  await clientProducer.connect();
}

async function handleConsumer(){
  var configTopic = topic;
  _clientConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({ topic: topic, value: message.value.toString() });
      var orderDetail = JSON.parse(message.value.toString());
      if(topic == configTopic.CHECK_STOCK) handleCheckStock(orderDetail);
      if(topic == configTopic.PURCHASE_FAIL) handlePurchaseFail(orderDetail);
      console.log(database);
    },
  });
}

async function main()
{
  initialize();
  handleConsumer();
}


main();


function handleCheckStock(orderDetail){
  var itemInDB = database.find(x=>x.itemName == orderDetail.name);
  var isItemInStock = itemInDB.stock > 0;

  if(isItemInStock)
  {
    itemInDB.stock-=1;
    console.log(`Check stock ${orderDetail.itemName} successful`);
    handlePurchase(orderDetail);
  }
  else
  {
    handleCheckStockFail(orderDetail);
    console.error(`Check stock  ${orderDetail.itemName} failed`);
  }
}

async function handlePurchase(orderDetail) {
  const orderTopic = {
    topic: topic.PURCHASE,
    messages: [{ value: JSON.stringify(orderDetail) }],
  };
  await clientProducer.send(orderTopic);
}

async function handleCheckStockFail(orderDetail) {

  const orderDetailFail = {
    id:orderDetail.id,
    itemName: orderDetail.name,
    success:false,
    reason:"This item out of stock !"
  }

  const orderTopic = {
    topic: topic.CHECK_STOCK_FAIL,
    messages: [{ value: JSON.stringify(orderDetailFail) }],
  };

  await clientProducer.send(orderTopic);
}

async function handlePurchaseFail(orderDetail) {

  var itemInDB = database.find(x=>x.itemName == orderDetail.name);

  const orderTopic = {
    topic: topic.CHECK_STOCK_FAIL,
    messages: [{ value: JSON.stringify(orderDetail) }],
  };

  console.error(`Purchase failed reserve stock for ${itemInDB.name}`);
  itemInDB.stock+=1;

  await clientProducer.send(orderTopic);
}
