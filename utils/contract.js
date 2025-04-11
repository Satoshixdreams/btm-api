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

async function transferTokens(fromPrivateKey, toAddress, amount) {
  try {
    // Use provided private key or fall back to environment variable
    const privateKey = fromPrivateKey || process.env.REWARDS_WALLET_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error("No private key provided");
    }
    
    // Ensure private key has correct format (add 0x prefix if missing)
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    // Create account from private key
    const account = web3.eth.accounts.privateKeyToAccount(formattedKey);
    web3.eth.accounts.wallet.add(account);
    
    console.log(`Preparing to transfer ${web3.utils.fromWei(amount, 'ether')} BTM from ${account.address} to ${toAddress}`);
    
    // Get gas price and estimate gas
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await tokenContract.methods.transfer(toAddress, amount).estimateGas({ from: account.address });
    
    console.log(`Estimated gas: ${gasEstimate}, Gas price: ${gasPrice}`);
    
    // Send transaction
    const receipt = await tokenContract.methods.transfer(toAddress, amount).send({
      from: account.address,
      gas: Math.round(gasEstimate * 1.2), // Add 20% buffer
      gasPrice
    });
    
    console.log(`Transaction successful: ${receipt.transactionHash}`);
    
    // Remove account from wallet for security
    web3.eth.accounts.wallet.remove(account.address);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('Error transferring tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  web3,
  tokenContract,
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
  getTokenTotalSupply,
  getTokenBalance,
  transferTokens  // Add this new function to exports
};