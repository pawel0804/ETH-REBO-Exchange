import React, { Component } from 'react';
import './App.css';
import Web3 from "web3";
import Token from '../abis/Token.json'
import EthSwap from '../abis/EthSwap.json';
import Navbar from "./Navbar";
import Main from "./Main";


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    this.setState({loading: false});
  }

  async loadBlockchainData() {
    if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      const web3 = window.web3;
      window.ethereum.enable();

      const accounts =  await web3.eth.getAccounts();
      this.setState({account: accounts[0]});

      const ethBalance = await web3.eth.getBalance(this.state.account);
      this.setState({ethBalance});

      const networkId = await web3.eth.net.getId();
      const tokenData = Token.networks[networkId];
      if (tokenData) {
        const token = new web3.eth.Contract(Token.abi, tokenData.address);
        this.setState({token});
        let tokenBalance = await token.methods.balanceOf(this.state.account).call();
        this.setState({tokenBalance: tokenBalance.toString()});
      } else {
        console.log('Token contract not deployed to detect network');
      }

      const ethSwapData = EthSwap.networks[networkId];
      if (ethSwapData) {
        const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address);
        this.setState({ethSwap});
      } else {
        console.log('Token contract not deployed to detect network');
      }
      return true;
    }
    return false;
  }

  async loadWeb3() {
    if (window.etherum) {
      window.web3 = new Web3(window.etherum);
      await window.etherum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Etherum browser detected. you should consider trying MetaMask!');
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true })
    this.state.ethSwap.methods.buyTokens()
        .send({ value: etherAmount, from: this.state.account })
        .on('transactionHash', (hash) => {
          this.setState({ loading: false })
        });
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount)
        .send({ from: this.state.account })
        .on('transactionHash', (hash) => {
          this.state.ethSwap.methods.sellTokens(tokenAmount)
              .send({ from: this.state.account })
              .on('transactionHash', (hash) => {
                this.setState({ loading: false })
              });
        });
  }

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      token: {},
      ethSwap: {},
      ethBalance: '0',
      tokenBalance: '0',
      loading: true
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>;
    } else {
      content =
          <Main
              ethBalance={this.state.ethBalance}
              tokenBalance={this.state.tokenBalance}
              buyTokens={this.buyTokens}
              sellTokens={this.sellTokens}
          />;
    }
    return (
      <div>
        <Navbar account={this.state.account}/>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
