const forge = require('node-forge');
const Web3 = require('web3').default;

// Connect to an Ethereum provider (e.g., local Ganache or Infura)
const web3 = new Web3('http://localhost:8545'); // Change to your provider

const contractABI = [ 
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "user",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "string",
					"name": "certHash",
					"type": "string"
				}
			],
			"name": "CertificateIssued",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "user",
					"type": "address"
				}
			],
			"name": "CertificateRevoked",
			"type": "event"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "user",
					"type": "address"
				},
				{
					"internalType": "string",
					"name": "certHash",
					"type": "string"
				}
			],
			"name": "issueCertificate",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "user",
					"type": "address"
				}
			],
			"name": "revokeCertificate",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"name": "certificates",
			"outputs": [
				{
					"internalType": "string",
					"name": "certHash",
					"type": "string"
				},
				{
					"internalType": "bool",
					"name": "isRevoked",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "user",
					"type": "address"
				}
			],
			"name": "getCertificateData",
			"outputs": [
				{
					"internalType": "string",
					"name": "",
					"type": "string"
				},
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "user",
					"type": "address"
				}
			],
			"name": "verifyCertificate",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
			
]; // Replace with your contract's ABI
const contractAddress = '0x6EdB7531834f5A99F317E55f8f8E9d5D12e984A3'; // Deployed contract address
const certificateAuthority = new web3.eth.Contract(contractABI, contractAddress);

// Generate an X.509 certificate
function generateCertificate(userAddress) {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validFrom = new Date().toISOString(); // Now
    cert.validTo = new Date();
    cert.validTo.setFullYear(cert.validTo.getFullYear() + 1); // Valid for 1 year
    cert.setSubject([{ name: 'commonName', value: userAddress }]);
    cert.setIssuer([{ name: 'commonName', value: 'Certificate Authority' }]);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Convert the certificate to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    return certPem;
}

// Function to issue a certificate
async function issueCertificate(userAddress) {
    const certPem = generateCertificate(userAddress);
    const certHash = web3.utils.sha3(certPem); // Hash the PEM to get the certHash

    try {
        const accounts = await web3.eth.getAccounts();

        // Estimate the gas required for the transaction
        const estimatedGas = await certificateAuthority.methods.issueCertificate(userAddress, certHash)
            .estimateGas({ from: accounts[0] });
		console.log(estimatedGas)

        // Send the transaction with the estimated gas
        const receipt = await certificateAuthority.methods.issueCertificate(userAddress, certHash)
            .send({ from: accounts[0], gas: estimatedGas });

        console.log(`Issued certificate to ${userAddress}. Transaction receipt:`, receipt);
        console.log(certHash);
    } catch (error) {
        console.error(`Failed to issue certificate for ${userAddress}:`, error.message);
    }
}


// Function to validate Ethereum addresses
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Function to verify a certificate
async function verifyCertificate(userAddress) {
    if (!isValidEthereumAddress(userAddress)) {
        console.error('Invalid Ethereum address:', userAddress);
        return;
    }

    try {
        const isValid = await certificateAuthority.methods.verifyCertificate(userAddress).call();
        console.log(`Certificate for ${userAddress} is valid: ${isValid}`);
    } catch (error) {
        console.error(`Failed to verify certificate for ${userAddress}:`, error.message);
        if (error.message.includes("Parameter decoding error")) {
            console.error("This might indicate an ABI mismatch or an incorrect address.");
        }
    }
}
// Function to revoke a certificate
async function revokeCertificate(userAddress) {
    try {
        const accounts = await web3.eth.getAccounts();
        const receipt = await certificateAuthority.methods.revokeCertificate(userAddress).send({ from: accounts[0] });
        console.log(`Revoked certificate for ${userAddress}. Transaction receipt:`, receipt);
    } catch (error) {
        console.error(`Failed to revoke certificate for ${userAddress}:`, error.message);
    }
}

// Main function to execute the script
(async () => {
    const userAddress = '0x1be0d9bf3ad8de1daddcea6a45f34e04ab34e608'; // Replace with actual user address

    // Issue a new certificate
    await issueCertificate(userAddress);

    // //Verify the issued certificate
    // await verifyCertificate(userAddress);

    // // Revoke the certificate
    // await revokeCertificate(userAddress);

    // // Verify again after revocation
    // await verifyCertificate(userAddress);
})();