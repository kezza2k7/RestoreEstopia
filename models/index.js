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
});

// Servers is seprate from Key due to if there was a databrech or it broke
const Servers = sequelize.define('Servers', {
    serverId: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false,
    },
    data: {
        type: Sequelize.STRING(1000),
        allowNull: false,
    },
});

const Panels = sequelize.define('Panels', {
    guildId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    roleId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    messageId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

const WebUsers = sequelize.define('WebUsers', {
    userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    webToken: {
        type: Sequelize.UUID,
        allowNull: true,
    },
    webTokenExpire: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: false
});

const UserDiscordLinks = sequelize.define('UserDiscordLinks', {
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    serverId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    linked_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: false
});

module.exports = {
    sequelize,
    AuthedUsers,
    Key,
    ApprovedUsers,
    Panels,
    Servers,
    UserDiscordLinks,
    WebUsers
};
