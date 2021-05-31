import {
  Connection,
  Model,
  Schema,
  Document
} from 'mongoose';

/**
 * Gender of a Person
 * @category Models
 */
export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

/**
 * Attributes of a person
 * @category Models
 */
export interface PersonInterface extends Document {
  /**
   * @param {string} name The name of the person
   */
  name: string;
  /**
   * @param {Number} age The age of the person
   */
  age: number;
  /**
   * @param {Gender} gender The gender of the person
   */
  gender: Gender;
  /**
   * @param {Date} dob The date of birth of the person
   */
  dob: Date;
  /**
   * @param {Date} createdAt
   */
  createdAt?: Date;
  /**
   * @param {Date} createdAt
   */
  updatedAt?: Date;
}

/**
 * Mogoose schema of a Person
 * @category Models
 */
const PersonSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true
  },
  age: {
    type: Schema.Types.Number,
    required: true
  },
  gender: {
    type: Schema.Types.String,
  },
  dob: {
    type: Schema.Types.Date
  }
}, {
  collection: 'people',
  timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'}
});

PersonSchema.pre<PersonInterface>('validate', function(next): void {
  // eslint-disable-next-line no-invalid-this
  if (!this.dob) this.dob = new Date();
  next();
});


/**
 * Factory to generate Person Model
 * @param {Connection} conn
 * @return {Model<PersonInterface>}
 * @category Models
 */
export default function factory(conn: Connection): Model<PersonInterface> {
  return conn.model<PersonInterface>('Person', PersonSchema);
}
