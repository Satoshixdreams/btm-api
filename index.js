const express = require('express');
const Web3 = require('web3');
require('dotenv').config(); // لإدارة المتغيرات البيئية

const app = express();

// عنوان RPC لـ Monad Testnet (يُؤخذ من متغير بيئي أو يُستخدم الافتراضي)
const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const web3 = new Web3(rpcUrl);

// عنوان عقد BTM
const contractAddress = '0x59d6d0ADB836Ed25a3E7921ded05BF1997E82b8d';

// ABI الخاص بالعقد
const abi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initialSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// إنشاء كائن العقد
const contract = new web3.eth.Contract(abi, contractAddress);

// التحقق من الاتصال بشبكة Monad
web3.eth.net.isListening()
  .then(() => console.log('Connected to Monad Testnet'))
  .catch(err => console.error('Failed to connect to Monad Testnet:', err));

// نقطة نهاية للتحقق من الصحة
app.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// نقطة نهاية للحصول على الرصيد
app.get('/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (!web3.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const balance = await contract.methods.balanceOf(address).call();
    res.json({ balance: balance / 10**18 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// نقطة نهاية للحصول على اسم العملة
app.get('/name', async (req, res) => {
  try {
    const name = await contract.methods.name().call();
    res.json({ name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// نقطة نهاية للحصول على رمز العملة
app.get('/symbol', async (req, res) => {
  try {
    const symbol = await contract.methods.symbol().call();
    res.json({ symbol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// نقطة نهاية للحصول على إجمالي المعروض
app.get('/totalSupply', async (req, res) => {
  try {
    const totalSupply = await contract.methods.totalSupply().call();
    res.json({ totalSupply: totalSupply / 10**18 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل الخادوم
const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => console.log(`API running on port ${port}`));
