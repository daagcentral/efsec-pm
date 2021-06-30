const admin = require('firebase-admin')
const serviceAccount = {
    "type": process.env.EFSEC_PM_FIREBASE_TYPE,
    "projectId": process.env.EFSEC_PM_FIREBASE_PROJECT_ID,
    "private_key_id": process.env.EFSEC_PM_FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.EFSEC_PM_FIREBASE_PRIVATE_KEY,
    "client_email": process.env.EFSEC_PM_FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.EFSEC_PM_FIREBASE_CLIENT_ID,
    "auth_uri": process.env.EFSEC_PM_FIREBASE_AUTH_URI,
    "token_uri": process.env.EFSEC_PM_FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.EFSEC_PM_FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.EFSEC_PM_FIREBASE_CLIENT_X509_CERT_URL,
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://efsec-pm.appspot.com'
})

module.exports = admin;