const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
});

const AuthedUsers = sequelize.define('AuthedUsers', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    username: {
        type: Sequelize.STRING,
    },
    accessToken: {
        type: Sequelize.STRING,
    },
    refreshToken: {
        type: Sequelize.STRING,
    },
});

const ApprovedUsers = sequelize.define('ApprovedUsers', {
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    serverId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'serverId'],
        },
    ],
});

const Key = sequelize.define('Key', {
    key: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
    },
    serverId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
    },
    serverName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    ownerId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    roleId: {
        type: Sequelize.STRING,
    },
});

const PendingUsers = sequelize.define('PendingUsers', {
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    serverId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'serverId'],
        },
    ],
});

module.exports = {
    sequelize,
    AuthedUsers,
    Key,
    PendingUsers,
    ApprovedUsers
};
