import {ConnectionOptions} from 'mongoose';

/**
 * MongoDB configurations
 * @category Configurations
 */
class Mongo {
  /**
   * @param {string} uri Connection string for mongodb database server
   */
  static uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

  /**
   * @param {ConnectionOptions} options Mongodb server options
   */
  static options: ConnectionOptions = {
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 20,
    poolSize: process.env.NODE_ENV !== 'development' ? 5 : 1,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  };
}

export default Mongo;
