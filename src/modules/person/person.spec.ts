import Person from './index';
import {expect} from 'chai';
import {
  describe,
  it,
  after,
  beforeEach,
  afterEach} from 'mocha';
import {
  conn,
  Person as PersonModel} from '../../models';

after(async function() {
  await conn.close();
});

describe('Person Module', () => {
  describe('#create', () => {
    beforeEach(async function() {
      this.personData = {
        name: 'Mike',
        age: 23,
        dob: new Date('1990-12-1'),
        gender: 'Male'
      };

      this.createdPerson = await new Person({model: PersonModel}).create(this.personData);
    });

    afterEach(async function() {
      await PersonModel.deleteMany({});
    });

    it('create a new person', async () => {
      expect(await PersonModel.countDocuments()).to.eq(1);
    });

    it('return user object', function () {
      expect(this.createdPerson).to.deep.includes(this.personData);
    });
  });

  describe('#getFullName', () => {
    it(' should return Mary Jane', () => {
      const fullName = Person.getFullName('Mary', 'Jane');
      expect(fullName).to.eq('Mary Jane');
    });
  });
});
