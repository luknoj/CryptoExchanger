# CryptoExchanger

The app fetches data from API and exchanges between all the currencies which come with the data. Server refreshes the data from api every 60 seconds, client does it every 15 seconds. All the changes can be seen on the chart with the time stamps.

## Launching

Install all dependecies
```
npm install
```
Set the addres for the server in the client

#### src/App.js
```
const socket = openSocket('http://46.228.234.6:8002');
```

Launch the server and client

#### Client
```
npm start
```
#### Server server/
```
node server.js
```


## Changing interval

The interval ar set in two places, first i set on the server for refreshing data from the api:

#### server/server.js
```
setInterval(() => {
  data = axios.get('https://api.abucoins.com/products/ticker')
  .then((response) => {
    (response.data.map((key) => {
      const splitted = key.product_id.split("-");
      currencyGraph.setNode(splitted[0]); 
      currencyGraph.setEdge(splitted[0], splitted[1], { value: parseFloat(key.price, 10) });
      currencyGraph.setEdge(splitted[1], splitted[0], { value: 1 / parseFloat(key.price, 10) });
    }));
    console.log("Refresh data time: " + response.data[0].time);
    return response.data;
  });
}, INTERVAL_TIME);
```
Second is set in the client. Every value is in **milliseconds**

#### src/App.js
```
socket.emit("exchangeCurrency", INTERVAL_TIME, parseFloat(this.state.value), this.state.from, this.state.to, null);
```