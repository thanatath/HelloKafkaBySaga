const thisService = "purchase";
require('../config/instrumentation.js')(thisService)
const { clientConsumer,clientProducer  } = require('../config/kafka.js')
const {topic} = require("../config/kafka.js");
const { uid } = require("uid");

// KafKa
const _clientConsumer = clientConsumer(thisService);

// Mock ThridParty Service
const ThridPartyPaymentService = {
  success: true,
};

// Mock DataBase
var database = [];

async function initialize() {
  await _clientConsumer.subscribe({
    topic: topic.PURCHASE,
  });
  await clientProducer.connect();
  await _clientConsumer.connect();  
}

async function handleConsumer(){
  await _clientConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({ topic: topic, value: message.value.toString() });
      var orderDetail = JSON.parse(message.value.toString());
      handlePurchase(orderDetail);
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


function handlePurchase(orderDetail){

  if(ThridPartyPaymentService.success)
  {
    database.push(orderDetail)
    handleNotification(orderDetail);
  }
  else
  {
    purchaseFail(orderDetail);
  }

}

async function handleNotification(orderDetail) {
  const orderTopic = {
    topic: topic.NOTIFICATION,
    messages: [{ value: JSON.stringify(orderDetail) }],
  };

  await clientProducer.send(orderTopic);
}

async function purchaseFail(orderDetail) {

  const orderDetailFail = {
    id:orderDetail.id,
    itemName:orderDetail.name,
    success:false,
    reason:"can't connect Payment Service"
  }

  const orderTopic = {
    topic: topic.PURCHASE_FAIL,
    messages: [{ value: JSON.stringify(orderDetailFail) }],
  };
  console.error(`can't connect Payment Service`);
  await clientProducer.send(orderTopic);
}


const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.forEach(type => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`)
      await clientProducer.disconnect()
      await _clientConsumer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      await clientProducer.disconnect()
      await _clientConsumer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})