const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiryDate: { type: Date, required: true },
});

// Helper to verify expiration
RefreshTokenSchema.statics.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
}

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);