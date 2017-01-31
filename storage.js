module.exports = () => {

  const db = require('monk')(process.env.MONGODB_URI),
        Team = db.get('teams'),
        User = db.get('users'),
        Channel = db.get('channels'),
        storage = {
          teams: {
            get: id => Team.findOne({id}),
            save: (id, data) => {
              data.updatedAt = new Date();
              return Team.findOneAndUpdate({id}, {$push: {suggestions: data}}, {upsert: true, new: true});
            },
            all: () => Team.find({})
          },
          users: {
            get: id => User.findOne({id}),
            save: (id, data) => {
              data.updatedAt = new Date();
              return User.findOneAndUpdate({id}, {$push: {suggestions: data}}, {upsert: true, new: true});
            },
            all: cb => User.find({})
          },
          channels: {
            get: id => Channel.findOne({id}),
            save: (id, data) => {
              data.updatedAt = new Date();
              return Channel.findOneAndUpdate({id}, {$push: {suggestions: data}}, {upsert: true, new: true});
            },
            all: () => Channel.find({})
          }
        };

  return storage;
};