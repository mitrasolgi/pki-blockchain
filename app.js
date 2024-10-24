const express = require('express'); // Ensure you have express installed
const path = require('path');
const forge = require('node-forge');
const Web3 = require('web3').default;

// Initialize Express app
const app = express();
const port = 3000; // Define your port

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to an Ethereum provider (e.g., local Ganache or Infura)
const web3 = new Web3('http://localhost:8545'); // Change to your provider

const contractABI = [ 
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
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
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
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

];
const contractAddress = '0xa0775B78c8231FD719c453e468bAF7a4B6991A7c'; // Deployed contract address
const certificateAuthority = new web3.eth.Contract(contractABI, contractAddress);

// Serve the static index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Ensure 'index.html' exists in the same directory
});

// // Generate an X.509 certificate
// function generateCertificate(userAddress) {
//     const keys = forge.pki.rsa.generateKeyPair(2048);
//     const cert = forge.pki.createCertificate();
//     cert.publicKey = keys.publicKey;
//     cert.serialNumber = '01';
//     cert.validFrom = new Date().toISOString(); // Now
//     cert.validTo = new Date();
//     cert.validTo.setFullYear(cert.validTo.getFullYear() + 1); // Valid for 1 year
//     cert.setSubject([{ name: 'commonName', value: userAddress }]);
//     cert.setIssuer([{ name: 'commonName', value: 'Certificate Authority' }]);
//     cert.sign(keys.privateKey, forge.md.sha256.create());

//     // Convert the certificate to PEM format
//     const certPem = forge.pki.certificateToPem(cert);
//     return certPem;
// }

async function revokeCertificate(userAddress) {
    try {
        const accounts = await web3.eth.getAccounts();

        const receipt = await certificateAuthority.methods.revokeCertificate(userAddress).send({ from: accounts[0] });
        console.log(`Successfully revoked certificate for ${userAddress}. Transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
        console.error(`Error revoking certificate for ${userAddress}:`, error.message);
        throw new Error(`Failed to revoke certificate for ${userAddress}. Please try again later.`);
    }
}
// Function to validate Ethereum addresses
function isValidEthereumAddress(address) {
    return web3.utils.isAddress(address);
}

app.post('/revoke-certificate', async (req, res) => {
    const userAddress = req.body.userAddress; // Get user address from the request body
    if (!isValidEthereumAddress(userAddress)) {
        return res.status(400).send({ error: 'The provided Ethereum address is invalid. Please ensure it starts with "0x" and contains 40 hexadecimal characters.' });
    }

    try {
        await revokeCertificate(userAddress);
        res.send({ message: `Certificate revocation process initiated for ${userAddress}.` });
    } catch (error) {
        console.error(`Error revoking certificate for ${userAddress}:`, error.message);
        res.status(500).send({ error: `Failed to revoke certificate for ${userAddress}. Please try again later.` });
    }
});
// Function to verify a certificate
async function verifyCertificate(userAddress) {
    try {
        const isValid = await certificateAuthority.methods.verifyCertificate(userAddress).call();
        console.log(`Verification result for ${userAddress}: ${isValid}`);
        return isValid;
    } catch (error) {
        console.error(`Error verifying certificate for ${userAddress}:`, error.message);
        throw new Error(`Failed to verify certificate for ${userAddress}. Please try again later.`);
    }
}

// POST endpoint to verify a certificate
app.post('/verify-certificate', async (req, res) => {
    const userAddress = req.body.userAddress; // Get user address from the request body
    if (!isValidEthereumAddress(userAddress)) {
        return res.status(400).send({ error: 'The provided Ethereum address is invalid. Please ensure it starts with "0x" and contains 40 hexadecimal characters.' });
    }

    try {
        const isValid = await verifyCertificate(userAddress);
        res.send({ isValid });
    } catch (error) {
        console.error(`Error verifying certificate for ${userAddress}:`, error.message);
        res.status(500).send({ error: `Failed to verify certificate for ${userAddress}. Please try again later.` });
    }
});

// POST endpoint to issue a certificate
app.post('/issue-certificate', async (req, res) => {
    const { userAddress, certPem } = req.body; // Get userAddress and certPem from the request body

    // Validate Ethereum address
    if (!isValidEthereumAddress(userAddress)) {
        return res.status(400).send({
            error: 'The provided Ethereum address is invalid. Please ensure it starts with "0x" and contains 40 hexadecimal characters.'
        });
    }

    try {
        // Generate the certHash from certPem
        const certHash = web3.utils.sha3(certPem);

        // Call the function to issue the certificate
        const message = await issueCertificate(userAddress, certHash, certPem);
        
        res.send({ message });
    } catch (error) {
        console.error(`Error issuing certificate for ${userAddress}:`, error.message);
        res.status(500).send({
            error: `Failed to issue certificate for ${userAddress}. Please try again later.`
        });
    }
});

async function issueCertificate(userAddress, certHash, certPem) {
    const accounts = await web3.eth.getAccounts();

    try {
        // Estimate gas for the transaction
        // const gasEstimate = await certificateAuthority.methods
        //     .issueCertificate(userAddress, certHash, certPem)
        //     .estimateGas({ from: accounts[0] });

        // console.log(gasEstimate)
        
        // Send the transaction to issue the certificate
        const receipt = await certificateAuthority.methods
            .issueCertificate(userAddress, certHash)
            .send({ from: accounts[0] });

        console.log(`Successfully issued certificate to ${userAddress}. Transaction hash: ${receipt.transactionHash}`);
        return `Certificate successfully issued to ${userAddress}. Transaction hash: ${receipt.transactionHash}`;
    } catch (error) {
        console.error(`Transaction error for ${userAddress}:`, error.message);
        throw new Error(`Failed to issue certificate for ${userAddress}. Reason: ${error.message}`);
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});