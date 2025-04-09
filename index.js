require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const app = express();
const contractUtils = require('./utils/contract');

// Middleware
app.use(express.json());

// Test connection to Monad Testnet
async function testConnection() {
  try {
    // Try different methods to test connection
    try {
      // First try getting the block number
      const blockNumber = await contractUtils.web3.eth.getBlockNumber();
      console.log(`Connected to Monad Testnet. Current block: ${blockNumber}`);
      return true;
    } catch (innerError) {
      // If that fails, try a different method
      try {
        const accounts = await contractUtils.web3.eth.getAccounts();
        console.log(`Connected to Monad Testnet. Found ${accounts.length} accounts.`);
        return true;
      } catch (accountError) {
        // If that also fails, try a simple web3 isConnected check
        if (contractUtils.web3.eth.net.isListening()) {
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

// Add BTM token info endpoint
app.get('/token-info', async (req, res) => {
  try {
    // Get token info from blockchain
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contractUtils.getTokenName(),
      contractUtils.getTokenSymbol(),
      contractUtils.getTokenDecimals(),
      contractUtils.getTokenTotalSupply()
    ]);
    
    const tokenInfo = {
      name,
      symbol,
      type: "ERC20",
      contractAddress: "0x59d6d0ADB836Ed25a3E7921ded05BF1997E82b8d",
      decimals,
      totalSupply
    };
    res.json(tokenInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add symbol endpoint
app.get('/symbol', async (req, res) => {
  console.log('Symbol endpoint accessed');
  try {
    const symbol = await contractUtils.getTokenSymbol();
    res.json({ symbol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add totalSupply endpoint
app.get('/totalSupply', async (req, res) => {
  console.log('Total supply endpoint accessed');
  try {
    const totalSupply = await contractUtils.getTokenTotalSupply();
    res.json({ totalSupply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const cors = require('cors');
// ...
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      callback(new Error(msg), false);
    }
  }
};
// Middleware
app.use(cors(corsOptions)); // Use configured CORS options
// Add balance endpoint
app.get('/balance', async (req, res) => {
  console.log('Balance endpoint accessed');
  try {
    // Get address from query parameter
    const address = req.query.address;
    
    if (!address) {
      return res.status(400).json({ error: "Address parameter is required" });
    }
    
    const balance = await contractUtils.getTokenBalance(address);
    const decimals = await contractUtils.getTokenDecimals();
    
    // Format the balance with decimals
    const formattedBalance = contractUtils.web3.utils.fromWei(balance, 'ether');
    
    res.json({ 
      address,
      balance,
      formattedBalance: `${formattedBalance} BTM`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
