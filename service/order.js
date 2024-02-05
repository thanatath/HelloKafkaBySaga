const { clientProducer,clientConsumer  } = require('../config/kafka.js')
const {topic} = require("../config/kafka.js");
const express = require("express");
const app = express();
const port = 3000;
const { uid } = require("uid");
const thisService = "order";

// kafka
const _clientConsumer = clientConsumer(thisService);

async function initialize() {
  await _clientConsumer.subscribe({topics: [topic.CHECK_STOCK_FAIL,topic.NOTIFICATION_RESULT]});
  await clientProducer.connect();
  await _clientConsumer.connect();
}

async function handleConsumer(){
  await _clientConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({ topic: topic, value: message.value.toString() });
    },
  });
}

async function main()
{
  initialize();
  handleConsumer();
}

main();


// route
app.get("/", async (req, res) => {
  checkStock();
  res.send("ส่งคำสั่งซื้อเรียบร้อยแล้ว !");
});

async function checkStock() {

  const orderDetail = {
    id:uid(),
    itemName:"watch",
    success:true,
  }

  const orderTopic = {
    topic: topic.CHECK_STOCK,
    messages: [{ value: JSON.stringify(orderDetail) }],
  };
  await clientProducer.send(orderTopic);
}

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});