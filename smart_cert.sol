// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateAuthority {
    struct Certificate {
        string certHash; // Hash of the certificate
        bool isRevoked;  // Revocation status
    }

    mapping(address => Certificate) public certificates;

    // Event to log certificate issuance
    event CertificateIssued(address indexed user, string certHash);
    // Event to log revocation
    event CertificateRevoked(address indexed user);

    // Function to issue a certificate
    function issueCertificate(address user, string memory certHash) public {
        require(bytes(certificates[user].certHash).length == 0, "Certificate already issued");
        certificates[user] = Certificate(certHash, false);
        emit CertificateIssued(user, certHash);
    }

    // Function to revoke a certificate
    function revokeCertificate(address user) public {
        require(!certificates[user].isRevoked, "Certificate already revoked");
        certificates[user].isRevoked = true;
        emit CertificateRevoked(user);
    }

    // Function to verify a certificate
    function verifyCertificate(address user) public view returns (bool) {
        return !certificates[user].isRevoked;
    }

    // Function to get certificate data
    function getCertificateData(address user) external view returns (string memory, bool) {
        return (certificates[user].certHash, certificates[user].isRevoked);
    }
}
