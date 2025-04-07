const Web3 = require('web3');
const tokenABI = require('../abi/token.json');

// Configure Web3
const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// Contract address
const contractAddress = '0x59d6d0ADB836Ed25a3E7921ded05BF1997E82b8d';

// Create contract instance
const tokenContract = new web3.eth.Contract(tokenABI, contractAddress);

// Helper functions
async function getTokenName() {
  try {
    return await tokenContract.methods.name().call();
  } catch (error) {
    console.error('Error getting token name:', error);
    return 'Bitmon'; // Fallback value
  }
}

async function getTokenSymbol() {
  try {
    return await tokenContract.methods.symbol().call();
  } catch (error) {
    console.error('Error getting token symbol:', error);
    return 'BTM'; // Fallback value
  }
}

async function getTokenDecimals() {
  try {
    return await tokenContract.methods.decimals().call();
  } catch (error) {
    console.error('Error getting token decimals:', error);
    return 18; // Fallback value
  }
}

async function getTokenTotalSupply() {
  try {
    const totalSupply = await tokenContract.methods.totalSupply().call();
    return totalSupply;
  } catch (error) {
    console.error('Error getting total supply:', error);
    return '210000000000000000000000000'; // Fallback value (210M with 18 decimals)
  }
}

async function getTokenBalance(address) {
  try {
    const balance = await tokenContract.methods.balanceOf(address).call();
    return balance;
  } catch (error) {
    console.error(`Error getting balance for ${address}:`, error);
    return '0';
  }
}

module.exports = {
  web3,
  tokenContract,
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
  getTokenTotalSupply,
  getTokenBalance
};