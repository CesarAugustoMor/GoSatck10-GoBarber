import Sequelize from 'sequelize';
import Mongoose from 'mongoose';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.conection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.conection))
      .map(model => model.associate && model.associate(this.conection.models));
  }

  mongo() {
    this.mongoConnection = Mongoose.connect(
      'mongodb+srv://gobarber:gobarber@cluster0-1lgke.gcp.mongodb.net/gobarber?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
      }
    );
  }
}

export default new Database();
