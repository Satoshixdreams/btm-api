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
    // Try different methods to test connection
    try {
      // First try getting the block number
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`Connected to Monad Testnet. Current block: ${blockNumber}`);
      return true;
    } catch (innerError) {
      // If that fails, try a different method
      try {
        const accounts = await web3.eth.getAccounts();
        console.log(`Connected to Monad Testnet. Found ${accounts.length} accounts.`);
        return true;
      } catch (accountError) {
        // If that also fails, try a simple web3 isConnected check
        if (web3.eth.net.isListening()) {
          console.log('Connected to Monad Testnet via isListening check.');
          return true;
        }
        throw new Error('All connection methods failed');
      }
    }
  } catch (error) {
    console.error('Failed to connect to Monad Testnet:', error.message);
    console.log('API will continue running without blockchain connectivity.');
    return false;
  }
}

// API Routes
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.json({ message: 'BTM API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health endpoint accessed');
  res.json({ status: 'ok' });
});

// Add a catch-all route to log attempted access to undefined routes
app.use((req, res) => {
  console.log(`Attempted to access undefined route: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Server is listening at http://localhost:${PORT}`);
  await testConnection();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
