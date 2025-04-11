require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const cors = require('cors'); // Import CORS
const app = express();
const contractUtils = require('./utils/contract');

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

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

// Add balance endpoint (with query parameter)
app.get('/balance', async (req, res) => {
  console.log('Balance endpoint accessed');
  try {
    // Get address from query parameter
    const address = req.query.address;
    
    if (!address) {
      return res.status(400).json({ error: "Address parameter is required" });
    }
    
    console.log(`Fetching balance for address: ${address}`);
    
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

// Add a new endpoint that accepts address as a path parameter
app.get('/balance/:address', async (req, res) => {
  console.log('Balance endpoint accessed with path parameter');
  try {
    // Get address from path parameter
    const address = req.params.address;
    
    console.log(`Fetching balance for address: ${address}`);
    
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

// Add claim rewards endpoint
app.post('/claim-rewards', async (req, res) => {
  console.log('Claim rewards endpoint accessed');
  try {
    const { playerAddress } = req.body;
    
    if (!playerAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "Player address is required" 
      });
    }
    
    // Validate Ethereum address format
    if (!contractUtils.web3.utils.isAddress(playerAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid Ethereum address format" 
      });
    }
    
    console.log(`Processing reward claim for address: ${playerAddress}`);
    
    // This would normally come from your database
    // For now, we'll simulate it with a mock function
    const playerPoints = await getPlayerPoints(playerAddress);
    const pointType = playerPoints.pvpPoints >= 1000 ? 'pvp' : 'pve';
    
    // Check if player has enough points
    if (pointType === 'pvp' && playerPoints.pvpPoints < 1000) {
      return res.status(400).json({ 
        success: false, 
        error: "Insufficient PvP points. 1000 points required." 
      });
    }
    
    if (pointType === 'pve' && playerPoints.pvePoints < 5000) {
      return res.status(400).json({ 
        success: false, 
        error: "Insufficient PvE points. 5000 points required." 
      });
    }
    
    // Calculate BTM amount (1 BTM for 1000 PvP or 5000 PvE)
    const btmAmount = 1.0;
    const btmAmountWei = contractUtils.web3.utils.toWei(btmAmount.toString(), 'ether');
    
    // Transfer BTM tokens to player
    // In a real implementation, you would use a private key stored securely
    // For now, we'll just simulate success
    const txResult = await simulateTokenTransfer(playerAddress, btmAmountWei);
    
    if (txResult.success) {
      // Update player points (subtract used points)
      // This would normally update your database
      await updatePlayerPoints(playerAddress, pointType);
      
      res.json({ 
        success: true, 
        message: "Rewards claimed successfully!", 
        claimedAmountBTM: btmAmount,
        transactionHash: txResult.transactionHash
      });
    } else {
      throw new Error("Token transfer failed");
    }
  } catch (error) {
    console.error('Error processing reward claim:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to process reward claim" 
    });
  }
});

// Mock functions for demonstration - replace with actual implementations
async function getPlayerPoints(address) {
  // In a real implementation, fetch this from your database
  // For demo purposes, return mock data
  return {
    pvpPoints: 1500,  // Mock value
    pvePoints: 6000   // Mock value
  };
}

async function updatePlayerPoints(address, pointType) {
  // In a real implementation, update your database
  console.log(`Updated ${pointType} points for ${address}`);
  return true;
}

async function simulateTokenTransfer(toAddress, amount) {
  // In a real implementation, this would use web3 to send a transaction
  // For demo purposes, simulate success
  console.log(`Simulated transfer of ${amount} wei to ${toAddress}`);
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 64)
  };
}

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
// Find this section around line 279
<<<<<<< HEAD
// Your local version of the code
=======
// The remote version of the code
>>>>>>> 99fcf857fff5ae1b99066ea0823c67d1facf67e4

// Database mock - in production, use a real database
const playerPointsDB = {};

// Add points endpoint
app.post('/add-points', async (req, res) => {
  console.log('Add points endpoint accessed');
  try {
    const { playerAddress, pointsToAdd } = req.body;
    
    if (!playerAddress || !pointsToAdd) {
      return res.status(400).json({ 
        success: false, 
        error: "Player address and points are required" 
      });
    }
    
    // Validate Ethereum address format
    if (!contractUtils.web3.utils.isAddress(playerAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid Ethereum address format" 
      });
    }
    
    // Validate points
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Points must be a positive number" 
      });
    }
    
    console.log(`Adding ${pointsToAdd} points for address: ${playerAddress}`);
    
    // Get current points (or initialize to 0)
    const currentPoints = playerPointsDB[playerAddress] || 0;
    
    // Add points
    playerPointsDB[playerAddress] = currentPoints + parseInt(pointsToAdd);
    
    res.json({ 
      success: true, 
      newTotalPoints: playerPointsDB[playerAddress]
    });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to add points" 
    });
  }
});

// Get points endpoint
app.get('/get-points/:address', async (req, res) => {
  console.log('Get points endpoint accessed');
  try {
    const address = req.params.address;
    
    // Validate Ethereum address format
    if (!contractUtils.web3.utils.isAddress(address)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid Ethereum address format" 
      });
    }
    
    console.log(`Fetching points for address: ${address}`);
    
    // Get current points (or return 0)
    const points = playerPointsDB[address] || 0;
    
    res.json({ 
      success: true, 
      points
    });
  } catch (error) {
    console.error('Error getting points:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to get points" 
    });
  }
});

// Claim rewards endpoint
app.post('/claim-rewards', async (req, res) => {
  console.log('Claim rewards endpoint accessed');
  try {
    const { playerAddress } = req.body;
    
    if (!playerAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "Player address is required" 
      });
    }
    
    // Validate Ethereum address format
    if (!contractUtils.web3.utils.isAddress(playerAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid Ethereum address format" 
      });
    }
    
    console.log(`Processing reward claim for address: ${playerAddress}`);
    
    // Get current points
    const currentPoints = playerPointsDB[playerAddress] || 0;
    
    // Check if player has enough points (5000 points = 1 BTM)
    if (currentPoints < 5000) {
      return res.status(400).json({ 
        success: false, 
        error: "Insufficient points. 5000 points required for 1 BTM." 
      });
    }
    
    // Calculate BTM amount
    const btmAmount = Math.floor(currentPoints / 5000);
    const btmAmountWei = contractUtils.web3.utils.toWei(btmAmount.toString(), 'ether');
    
    console.log(`Converting ${currentPoints} points to ${btmAmount} BTM for ${playerAddress}`);
    
    try {
      // Get private key from environment variable
      const privateKey = process.env.REWARDS_WALLET_PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error("Rewards wallet private key not configured");
      }
      
      // Transfer BTM tokens to player
      const txResult = await contractUtils.transferTokens(privateKey, playerAddress, btmAmountWei);
      
      if (txResult.success) {
        // Reset player points to 0
        playerPointsDB[playerAddress] = 0;
        
        res.json({ 
          success: true, 
          message: "Claim successful!", 
          claimedAmountBTM: btmAmount,
          transactionHash: txResult.transactionHash
        });
      } else {
        throw new Error(txResult.error || "Token transfer failed");
      }
    } catch (transferError) {
      console.error('Error transferring tokens:', transferError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to transfer tokens. Please try again later." 
      });
    }
  } catch (error) {
    console.error('Error processing reward claim:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to process reward claim" 
    });
  }
});
=======
>>>>>>> 99fcf857fff5ae1b99066ea0823c67d1facf67e4
