const forge = require('node-forge');

// Generate a key pair
const keys = forge.pki.rsa.generateKeyPair(2048);
const publicKey = keys.publicKey;
const privateKey = keys.privateKey;

// Create a new certificate
const cert = forge.pki.createCertificate();
cert.serialNumber = '01'; // Serial number for the certificate
cert.validFrom = new Date(); // Start date for the certificate
cert.validTo = new Date();
cert.validTo.setFullYear(cert.validTo.getFullYear() + 1); // Valid for 1 year

// Set subject and issuer
const attrs = [
  { name: 'commonName', value: 'mitrasolgi' }, // Replace with your common name
  { name: 'countryName', value: 'CA' }, // Country code
  { name: 'organizationName', value: 'Udem' }, // Organization
  { name: 'organizationalUnitName', value: 'CS' }, // Organizational Unit
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// Set public key
cert.publicKey = publicKey;

// Sign the certificate with the private key
cert.sign(privateKey, forge.md.sha256.create());

// Convert the certificate to PEM format
const pem = forge.pki.certificateToPem(cert);
console.log('Generated X.509 Certificate:\n', pem);

// Export the private key to PEM format
const privatePem = forge.pki.privateKeyToPem(privateKey);
console.log('Private Key:\n', privatePem);
