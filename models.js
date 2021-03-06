const Sequelize = require('sequelize');
const config = require('./config');

const instance = new Sequelize(config.db, {
    define: {
        freezeTableName: true
    },
    logging: (process.env.NODE_ENV === "production" ? false : console.log)
});
module.exports.instance = instance;

// Model definitions
const Pilot = instance.define('Pilot', {
    facebookId: {type: Sequelize.STRING, unique: true},
    googleId: {type: Sequelize.STRING, unique: true},
    alias: {type: Sequelize.STRING, allowNull: false, validate: {len: [1, 40]}},
    familyName: {type: Sequelize.STRING, allowNull: false, defaultValue: ''},
    firstName: {type: Sequelize.STRING, allowNull: false, defaultValue: ''},
    email: {type: Sequelize.STRING, unique: true, validate: {isEmail: true}},
    telephone: {type: Sequelize.STRING},
    notes: {type: Sequelize.TEXT, allowNull: false, defaultValue: ''},
    location: Sequelize.TEXT,
    lat: Sequelize.DOUBLE,
    lng: Sequelize.DOUBLE,
    password: {type: Sequelize.STRING},
    emailConfirmed: {type: Sequelize.BOOLEAN},
    emailConfirmToken: {type: Sequelize.UUID, unique: true},
    admin: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
    avatar: {type: Sequelize.UUID}
});

const Event = instance.define('Event', {
    date: {type: Sequelize.DATE, allowNull: false},
    deadline: {type: Sequelize.DATE, allowNull: false},
    title: {type: Sequelize.STRING, allowNull: false, validate: {len: [3, 40]}},
    isCancelled: {type: Sequelize.BOOLEAN , allowNull: false, defaultValue: false},
    maxParticipants: {type: Sequelize.INTEGER, validate: {min: 1}},
    location: {type: Sequelize.STRING},
    lat: Sequelize.DOUBLE,
    lng: Sequelize.DOUBLE,
    policy: {type: Sequelize.STRING},
    notes: {type: Sequelize.TEXT, allowNull: false, defaultValue: ''},
    isOfficial: {type: Sequelize.BOOLEAN}
});

const Race = instance.define('Race', {
    sizeMulti: {type: Sequelize.INTEGER, allowNull: false},
    battery: {type: Sequelize.INTEGER, allowNull: false}
});

const Result = instance.define('Result', {
    place: {type: Sequelize.INTEGER, allowNull: false}
});

const Multi = instance.define('Multi', {
    name: {type: Sequelize.STRING, allowNull: false},
    frameSize: {type: Sequelize.INTEGER, allowNull: false},
    propellerSize: {type: Sequelize.INTEGER, allowNull: false},
    propellerBlades: {type: Sequelize.INTEGER, allowNull: false},
    battery: {type: Sequelize.INTEGER, allowNull: false},
    numberOfMotors: {type: Sequelize.INTEGER, allowNull: false},
    notes: {type: Sequelize.TEXT, allowNull: false, defaultValue: ''},
    image: {type: Sequelize.UUID}
});

const Participation = instance.define('Participation', {
    isCreator: {type: Sequelize.BOOLEAN, allowNull: false}
});

const PilotImage = instance.define('PilotImage', {
    id: {type: Sequelize.UUID, allowNull: false, primaryKey: true}
});

// Associations
Multi.belongsTo(Pilot, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Pilot.hasMany(Multi);

Pilot.belongsToMany(Event, {through: Participation});
Event.belongsToMany(Pilot, {through: Participation});

Result.belongsTo(Race, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Result.belongsTo(Multi, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});

Race.belongsTo(Event, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Event.hasMany(Race);

PilotImage.belongsTo(Pilot, {as: 'Uploader', foreignKey: {allowNull: false}});
