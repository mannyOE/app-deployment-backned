const firebase = require('firebase-admin');
import {join} from 'path';
const serviceAccount = require(join(
    __dirname,
    '../../firebase-service.json'
  ));
  
  firebase.initializeApp(
    {
          credential: firebase.credential.cert(serviceAccount),
          databaseURL: "https://zeedas-e4e53.firebaseio.com",
    }
);
  /**
 * @category Credentialss
 */
import { database} from 'firebase-admin'

export const saveMsgToFirebaseDatabase = async function(
    message: string,
    appId: string,
) {
    const dbRef = database().ref('status')
    await dbRef
        .child(appId).child(message)
        .set(true)
        .then((resp) => { })
        .catch((error: Error) => console.log(error))
}