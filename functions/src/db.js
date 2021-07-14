const admin = require('firebase-admin')

const serviceAccount = {
    "type": env_config.service.efsec_pm_firebase_type,
    "projectId": env_config.service.efsec_pm_firebase_project_id,
    "private_key_id": env_config.service.efsec_pm_firebase_private_key_id,
    "private_key": env_config.service.efsec_pm_firebase_private_key.replace(/\\n/g, '\n'),
    "client_email": env_config.service.efsec_pm_firebase_client_email,
    "client_id": env_config.service.efsec_pm_firebase_client_id,
    "auth_uri": env_config.service.efsec_pm_firebase_auth_uri,
    "token_uri": env_config.service.efsec_pm_firebase_token_uri,
    "auth_provider_x509_cert_url": env_config.service.efsec_pm_firebase_auth_provider_x509_cert_url,
    "client_x509_cert_url": env_config.service.efsec_pm_firebase_client_x509_cert_url,
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://efsec-pm.appspot.com'
})

module.exports = admin;
