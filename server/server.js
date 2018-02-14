const socket = require('socket.io')();
const axios = require('axios');
const Graph = require('graphlib');

var currencyGraph = new Graph.Graph();
var data = axios.get('https://api.abucoins.com/products/ticker')
  .then((response) => {
    (response.data.map((key) => {
      const splitted = key.product_id.split("-");
      currencyGraph.setEdge(splitted[0], splitted[1], { value: parseFloat(key.price, 10) });
      currencyGraph.setEdge(splitted[1], splitted[0], { value: 1 / parseFloat(key.price, 10) });
    }));
  })
setInterval(() => {
  data = axios.get('https://api.abucoins.com/products/ticker')
  .then((response) => {
    (response.data.map((key) => {
      const splitted = key.product_id.split("-");
      currencyGraph.setNode(splitted[0]); 
      currencyGraph.setEdge(splitted[0], splitted[1], { value: parseFloat(key.price, 10) });
      currencyGraph.setEdge(splitted[1], splitted[0], { value: 1 / parseFloat(key.price, 10) });
    }));
    return response.data;
  });
}, 60000);
exchange = (value, from, to) => {
  if(from == to){
    return value;
  } 
  if((Graph.alg.dijkstra(currencyGraph, from))[to].distance === Infinity){
    return "Cant find the proper exchange to";
  }
  if((Graph.alg.dijkstra(currencyGraph, from))[to].distance == 1){
    return (value *= currencyGraph.edge(from, to).value);
  } else {
    var lastNode = (Graph.alg.dijkstra(currencyGraph, from))[to].predecessor
    var distance = (Graph.alg.dijkstra(currencyGraph, from))[to].distance;
    while(distance != 1){
      distance = (Graph.alg.dijkstra(currencyGraph, from))[nextNode].distance;
      if(distance == 1){
        value *= currencyGraph.edge(from, nextNode).value;
        from = nextNode;
        distance = (Graph.alg.dijkstra(currencyGraph, from))[to].distance;
        nextNode = (Graph.alg.dijkstra(currencyGraph, from))[to].predecessor;
      } else {
        nextNode = (Graph.alg.dijkstra(currencyGraph, from))[nextNode].predecessor;
      }
    }
    value *= currencyGraph.edge(from, to).value;
    return value;
  }
};
socket.on('connection', (client) => {
  console.log("Client connected");
  var intervalId;
  client.on('exchangeCurrency', (interval, value, from, to) => {
    if(currencyGraph.nodes().indexOf(from) === -1 || currencyGraph.nodes().indexOf(to) === -1){
      client.emit("errorServer", "Please choose a correct currency!");
      client.disconnect();
    }
    if(typeof value != "number") 
    {
      client.emit("errorServer", "Please give a number!");
      client.disconnect();
    }
    if(value <= 0) 
    {
      client.emit("errorServer", "Please give amouth bigger than 0");
      client.disconnect();
    }
    data
      .then((response) => {
        client.emit('currency', {
          value: exchange(value, from, to),
          currency: to,
          date: new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds(),
        });
      })
    clearInterval(intervalId);
    intervalId = setInterval((value, from ,to) => {
      var date = new Date();
      data
      .then((response) => {
        client.emit('currency', {
          value: exchange(value, from, to),
          currency: to,
          date: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
        });
      })
      .catch((error) => {
        console.log(error);
        client.emit("error", "Please choose a correct currency!");
      });
    }, interval, value, from ,to);
    client.on("disconnect", () => {
      console.log("Client disconnected");
      clearInterval(intervalId);
    });
  });
});

socket.listen(8000);
console.log("Listening on port 8000");