import React, { Component } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import axios from 'axios';
import './App.css';
import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:8000');

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      exchangedValue: null,
      value: null,
      from: "ETH",
      to: "ETH",
      currencies: [],
      data: [],
      error: null,
    };
    socket.on("currency", (output) => this.setState({ exchangedValue: output.value + " " + output.currency, data: [...this.state.data, output] }));
    socket.on("errorServer", (output) => this.setState({ error: output }));
  }
  handleClick(){
    socket.open();
    this.setState({ 
      data: [], 
      error: null,
      exchangedValue: null 
    });
    socket.emit("exchangeCurrency", 15000, parseFloat(this.state.value), this.state.from, this.state.to, null);
  }
  componentDidMount(){
    this.getCurrencies();
  }

  getCurrencies = () => {
    axios.get('https://api.abucoins.com/products/ticker')
    .then(response => response.data.reduce((memo, key) => {
      return new Set([...memo, ...key.product_id.split("-")])
    }, new Set()))
    .then((result) => {
      let currencies = Array.from(result);
      this.setState({ currencies });
    })
    .catch((error) => {
      console.log(error);
    });
  }
  renderCurrencies = () => {
    if(this.state.currencies === [])
    {
      return <p>{this.state.currencies}</p>
    }
    else {
      return this.state.currencies.map((value, index) => {
        return(
          <option key={index} value={value}>{value}</option>
        )
      })

    }
  }

  render() {
    return (
      <div className="App">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-center">
            <div className="col-6 input-form">
              <form action="">
                <div className="form-group">
                  <input className="form-control" type="text" pattern="[1-9]*"placeholder="value" onChange={(e) => { this.setState({ value: e.target.value })}} required/>
                </div>
                <div className="row">
                  <div className="form-group col-6">
                    <label htmlFor="from">From</label>
                    <select className="form-control" name="from" onChange={(e) => this.setState({ from: e.target.value })} >
                      {this.renderCurrencies()}
                    </select>
                  </div>
                  <div className="form-group col-6">
                    <label htmlFor="to">To</label>
                    <select className="form-control" name="to" onChange={(e) => this.setState({ to: e.target.value })}>
                      {this.renderCurrencies()}
                    </select>
                  </div>
                </div>
              </form>
              <div className="text-center">
                <button className="btn btn-primary" placeholder="value" onClick={() => this.handleClick()}>Submit</button>
                {this.state.exchangedValue !== null ? <p className="text-success" > {this.state.exchangedValue} </p>: "" }
              </div>
              <div className="text-center">
                {this.state.error != null ? <p className="text-danger">{this.state.error}</p> : ""}
              </div>
              <LineChart width={600} height={300} data={this.state.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="value" stroke="#000000" />
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              </LineChart>
            </div> 
          </div>
        </div>
      </div>
    );
  }
}
export default App;
