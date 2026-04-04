# Test Cases - Wallet & Transaction APIs

## Wallet Tests

### Test 1: Create Wallet
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ví Tiền Mặt",
    "initial_balance": 500000,
    "currency": "VND",
    "icon_id": "wallet_cash"
  }'
```

Expected: 201 Created with wallet data

---

### Test 2: Get All Wallets
```bash
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with list of wallets including current_balance

---

### Test 3: Get Wallet By ID
```bash
curl -X GET http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with wallet details

---

### Test 4: Update Wallet
```bash
curl -X PUT http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ví Tiền Mặt - Updated",
    "initial_balance": 600000
  }'
```

Expected: 200 OK with updated wallet data

---

### Test 5: Delete Wallet
```bash
curl -X DELETE http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with success message

---

## Transaction Tests

### Test 6: Create Income Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "category_id": "CATEGORY_ID",
    "amount": 1200000,
    "type": "income",
    "transaction_date": "2026-04-03T10:00:00Z",
    "note": "Lương tháng 4"
  }'
```

Expected: 201 Created with transaction data

---

### Test 7: Create Expense Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "category_id": "CATEGORY_ID",
    "amount": 50000,
    "type": "expense",
    "transaction_date": "2026-04-03T14:00:00Z",
    "note": "Ăn uống"
  }'
```

Expected: 201 Created with transaction data

---

### Test 8: Get All Transactions
```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with list of all transactions

---

### Test 9: Get Transactions by Wallet
```bash
curl -X GET http://localhost:3000/api/transactions/wallet/WALLET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with list of transactions for specific wallet

---

### Test 10: Get Transactions with Filters
```bash
curl -X GET "http://localhost:3000/api/transactions?type=expense&start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with filtered transactions

---

### Test 11: Get Transaction Statistics
```bash
curl -X GET "http://localhost:3000/api/transactions/wallet/WALLET_ID/statistics?start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with statistics (total_income, total_expense, balance, transaction_count)

---

### Test 12: Update Transaction
```bash
curl -X PUT http://localhost:3000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 75000,
    "note": "Ăn uống - Updated"
  }'
```

Expected: 200 OK with updated transaction data

---

### Test 13: Delete Transaction
```bash
curl -X DELETE http://localhost:3000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with success message

---

## Error Test Cases

### Test 14: Create Transaction with Invalid Amount
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "amount": -50000,
    "type": "expense"
  }'
```

Expected: 400 Bad Request - "Số tiền phải lớn hơn 0"

---

### Test 15: Access Wallet Without Authorization
```bash
curl -X GET http://localhost:3000/api/wallets
```

Expected: 401 Unauthorized

---

### Test 16: Access Another User's Wallet
```bash
curl -X GET http://localhost:3000/api/wallets/OTHER_USER_WALLET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 403 Forbidden - "Bạn không có quyền truy cập ví này"

---

## Integration Test Flow

1. **Login** to get JWT token
2. **Create Wallet** and save wallet_id
3. **Create Income Transaction** with the wallet_id
4. **Create Expense Transaction** with the wallet_id
5. **Get Wallet** and verify current_balance = initial_balance + income - expense
6. **Get Statistics** and verify totals
7. **Update Transaction** and verify changes
8. **Delete Transaction** and verify it's removed
9. **Update Wallet** and verify changes
10. **Delete Wallet** (soft delete) and verify is_active = false

---

## Notes for Testing

1. Replace `YOUR_TOKEN` with actual JWT token from login
2. Replace `WALLET_ID`, `CATEGORY_ID`, `TRANSACTION_ID` with actual UUIDs
3. All amount values are in VND (Vietnam Dong)
4. Dates should be in ISO 8601 format
5. Test with Postman, Insomnia, or curl commands
