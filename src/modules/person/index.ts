import {Model} from 'mongoose';
import {PersonInterface} from '../../models/person';
import Module, {QueryInterface} from '../module';

interface PersonConstructorInterface {
  model: Model<PersonInterface>;
}

/**
 * @interface
 * @category Modules
 */
interface NewPersonInterface {
  name: PersonInterface['name'];
  age: PersonInterface['age'];
  gender: PersonInterface['gender'];
  dob: PersonInterface['dob'];
}

/**
 * Person module: handle all person interaction with database and business logic
 * @category Modules
 */
class Person extends Module {
  private model: Model<PersonInterface>;

  /**
   * @constructor
   * @param {Object} props
   * @param {Model<PersonInterface>} props.model Mongoose Person model
   */
  constructor(props: PersonConstructorInterface) {
    super();
    this.model = props.model;
  }

  /**
   * Creates a new person
   * @param {NewPersonInterface} data property of person to be created
   * @throws MongooseError.ValidationError
   * @throws MongoError
   * @throws DuplicateException
   * @return {Promise<Object>}
   */
  public async create(data: NewPersonInterface): Promise<PersonInterface|undefined> {
    // Todo: implement create person
    let newPerson: PersonInterface|undefined;

    try {
      newPerson = await this.model.create(data);
    } catch (e) {
      this.handleException(e);
    }

    return newPerson;
  }

  /**
   * Fetch people
   * @param {QueryInterface} query
   */
  async get(query: QueryInterface): Promise<PersonInterface[]> {
    // Todo: implement fetch people
    const people: PersonInterface[] = [];
    return Promise.resolve(people);
  }

  /**
   * Update a person record
   * @param {object} prop the person properties to update
   * @param {object} options other option that would influence how the update will be performed.
   * @throws MongoError
   * @return {PersonInterface}
   */
  async update(prop: object, options: object): Promise<object> {
    return Promise.resolve({});
    // Todo: implement update
  }

  /**
   * Deletes a person from the database
   * @param {string} personId Id of the person
   * @throws MongoError
   */
  public async delete(personId: string): Promise<boolean> {
    return Promise.resolve(true);
    // Todo: implement delete operation
  }

  /**
   * getFullName method
   * @param {string} firstName
   * @param {string} lastName
   * @return {string}
   */
  static getFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
  }
}

export default Person;
