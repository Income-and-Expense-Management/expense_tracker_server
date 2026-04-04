// Demo script to test Wallet & Transaction APIs
// Sử dụng file này để test nhanh các API endpoints
// Replace YOUR_TOKEN với JWT token thực tế sau khi đăng nhập

const BASE_URL = 'http://localhost:3000/api';
const TOKEN = 'YOUR_TOKEN_HERE';

// ============================================
// WALLET APIs
// ============================================

// 1. Create Wallet
const createWallet = async () => {
  const response = await fetch(`${BASE_URL}/wallets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Ví Tiền Mặt',
      initial_balance: 500000,
      currency: 'VND',
      icon_id: 'wallet_cash',
    }),
  });
  const data = await response.json();
  console.log('Create Wallet:', data);
  return data.data?.id; // Return wallet ID
};

// 2. Get All Wallets
const getAllWallets = async () => {
  const response = await fetch(`${BASE_URL}/wallets`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Get All Wallets:', data);
  return data;
};

// 3. Get Wallet By ID
const getWalletById = async (walletId) => {
  const response = await fetch(`${BASE_URL}/wallets/${walletId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Get Wallet By ID:', data);
  return data;
};

// 4. Update Wallet
const updateWallet = async (walletId) => {
  const response = await fetch(`${BASE_URL}/wallets/${walletId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Ví Tiền Mặt - Updated',
      initial_balance: 600000,
    }),
  });
  const data = await response.json();
  console.log('Update Wallet:', data);
  return data;
};

// 5. Delete Wallet
const deleteWallet = async (walletId) => {
  const response = await fetch(`${BASE_URL}/wallets/${walletId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Delete Wallet:', data);
  return data;
};

// ============================================
// CATEGORY APIs
// ============================================

// 1. Create Category
const createCategory = async () => {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Ăn uống',
      type: 'expense',
      icon_name: 'food_icon',
    }),
  });
  const data = await response.json();
  console.log('Create Category:', data);
  return data.data?.id; // Return category ID
};

// 2. Get All Categories
const getAllCategories = async () => {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Get All Categories:', data);
  return data;
};

// ============================================
// TRANSACTION APIs
// ============================================

// 1. Create Income Transaction
const createIncomeTransaction = async (walletId, categoryId) => {
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet_id: walletId,
      category_id: categoryId,
      amount: 1200000,
      type: 'income',
      transaction_date: new Date().toISOString(),
      note: 'Lương tháng 4',
    }),
  });
  const data = await response.json();
  console.log('Create Income Transaction:', data);
  return data.data?.id;
};

// 2. Create Expense Transaction
const createExpenseTransaction = async (walletId, categoryId) => {
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet_id: walletId,
      category_id: categoryId,
      amount: 50000,
      type: 'expense',
      transaction_date: new Date().toISOString(),
      note: 'Ăn uống',
    }),
  });
  const data = await response.json();
  console.log('Create Expense Transaction:', data);
  return data.data?.id;
};

// 3. Get All Transactions
const getAllTransactions = async () => {
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Get All Transactions:', data);
  return data;
};

// 4. Get Transactions by Wallet
const getTransactionsByWallet = async (walletId) => {
  const response = await fetch(`${BASE_URL}/transactions/wallet/${walletId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Get Transactions by Wallet:', data);
  return data;
};

// 5. Get Statistics
const getStatistics = async (walletId) => {
  const startDate = '2026-04-01';
  const endDate = '2026-04-30';
  const response = await fetch(
    `${BASE_URL}/transactions/wallet/${walletId}/statistics?start_date=${startDate}&end_date=${endDate}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
    }
  );
  const data = await response.json();
  console.log('Get Statistics:', data);
  return data;
};

// 6. Update Transaction
const updateTransaction = async (transactionId) => {
  const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 75000,
      note: 'Ăn uống - Updated',
    }),
  });
  const data = await response.json();
  console.log('Update Transaction:', data);
  return data;
};

// 7. Delete Transaction
const deleteTransaction = async (transactionId) => {
  const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  const data = await response.json();
  console.log('Delete Transaction:', data);
  return data;
};

// ============================================
// RUN ALL TESTS IN SEQUENCE
// ============================================

const runAllTests = async () => {
  console.log('========================================');
  console.log('Starting API Tests...');
  console.log('========================================\n');

  try {
    // Step 1: Create Category
    console.log('Step 1: Creating category...');
    const categoryId = await createCategory();
    console.log(`✅ Category created with ID: ${categoryId}\n`);

    // Step 2: Create Wallet
    console.log('Step 2: Creating wallet...');
    const walletId = await createWallet();
    console.log(`✅ Wallet created with ID: ${walletId}\n`);

    // Step 3: Get All Wallets
    console.log('Step 3: Getting all wallets...');
    await getAllWallets();
    console.log('✅ Retrieved all wallets\n');

    // Step 4: Create Income Transaction
    console.log('Step 4: Creating income transaction...');
    const incomeId = await createIncomeTransaction(walletId, categoryId);
    console.log(`✅ Income transaction created with ID: ${incomeId}\n`);

    // Step 5: Create Expense Transaction
    console.log('Step 5: Creating expense transaction...');
    const expenseId = await createExpenseTransaction(walletId, categoryId);
    console.log(`✅ Expense transaction created with ID: ${expenseId}\n`);

    // Step 6: Get Wallet with Balance
    console.log('Step 6: Getting wallet with updated balance...');
    await getWalletById(walletId);
    console.log('✅ Retrieved wallet with balance\n');

    // Step 7: Get All Transactions
    console.log('Step 7: Getting all transactions...');
    await getAllTransactions();
    console.log('✅ Retrieved all transactions\n');

    // Step 8: Get Transactions by Wallet
    console.log('Step 8: Getting transactions by wallet...');
    await getTransactionsByWallet(walletId);
    console.log('✅ Retrieved transactions by wallet\n');

    // Step 9: Get Statistics
    console.log('Step 9: Getting statistics...');
    await getStatistics(walletId);
    console.log('✅ Retrieved statistics\n');

    // Step 10: Update Transaction
    console.log('Step 10: Updating transaction...');
    await updateTransaction(expenseId);
    console.log('✅ Transaction updated\n');

    console.log('========================================');
    console.log('✅ All tests completed successfully!');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// ============================================
// INSTRUCTIONS
// ============================================

console.log(`
========================================
API Demo Script
========================================

IMPORTANT: Before running this script:

1. Start the server:
   node server.js

2. Login to get JWT token:
   POST http://localhost:3000/api/auth/login
   Body: { "email": "your@email.com", "password": "your-password" }

3. Copy the token from response and replace TOKEN variable above

4. Run this script:
   node demo-api-test.js

Or you can test individual functions:
- await createWallet()
- await getAllWallets()
- await createCategory()
- await createIncomeTransaction(walletId, categoryId)
- etc.

========================================
`);

// Uncomment line below to run all tests
// runAllTests();

// Export functions for use in Node REPL or other scripts
module.exports = {
  createWallet,
  getAllWallets,
  getWalletById,
  updateWallet,
  deleteWallet,
  createCategory,
  getAllCategories,
  createIncomeTransaction,
  createExpenseTransaction,
  getAllTransactions,
  getTransactionsByWallet,
  getStatistics,
  updateTransaction,
  deleteTransaction,
  runAllTests,
};
