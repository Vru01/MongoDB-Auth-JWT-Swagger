const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.js');
const User = require('./User'); // Import User to link them

const RefreshToken = sequelize.define('RefreshToken', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

// Create relationship: User has many tokens
User.hasMany(RefreshToken, { onDelete: 'CASCADE' });
RefreshToken.belongsTo(User);

// Helper function
RefreshToken.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
};

module.exports = RefreshToken;