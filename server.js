require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Middleware giúp server đọc được dữ liệu JSON từ app Android gửi lên
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request/response logger (helpful for debugging)
app.use(require('./middleware/requestLogger'));

// Auth routes
app.use('/api/auth', authRoutes);

// Wallet routes
app.use('/api/wallets', walletRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy API endpoint này',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trên server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});