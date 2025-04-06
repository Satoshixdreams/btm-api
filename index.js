require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const app = express();

// Middleware
app.use(express.json());

// Configure Web3
const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// Test connection to Monad Testnet
async function testConnection() {
  try {
    // Use a basic method to test connection
    const networkId = await web3.eth.net.getId();
    console.log(`Connected to Monad Testnet. Network ID: ${networkId}`);
    return true;
  } catch (error) {
    console.error('Failed to connect to Monad Testnet:', error.message);
    // Continue running the API even if connection fails
    return false;
  }
}

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'BTM API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add your other API endpoints here

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  await testConnection();
});
