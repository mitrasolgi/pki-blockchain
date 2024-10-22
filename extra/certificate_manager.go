package main

import (
    "crypto/rand"
    "crypto/x509"
    "crypto/x509/pkix"
    "encoding/pem"
    "fmt"
    "math/big"
    "os"
    "time"
)

func generateCertificate() {
    // Set up certificate template
    certTemplate := x509.Certificate{
        SerialNumber: big.NewInt(1),
        Subject: pkix.Name{
            Country:      []string{"US"},
            Organization: []string{"My Organization"},
            CommonName:   "example.com",
        },
        NotBefore:             time.Now(),
        NotAfter:              time.Now().Add(365 * 24 * time.Hour), // valid for 1 year
        KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
        ExtKeyUsage:          []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
        BasicConstraintsValid: true,
    }

    // Generate a new RSA key pair
    priv, err := rsa.GenerateKey(rand.Reader, 2048)
    if err != nil {
        fmt.Println(err)
        return
    }

    // Create the certificate
    certDER, err := x509.CreateCertificate(rand.Reader, &certTemplate, &certTemplate, &priv.PublicKey, priv)
    if err != nil {
        fmt.Println(err)
        return
    }

    // Save the private key
    privFile, err := os.Create("private_key.pem")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer privFile.Close()
    pem.Encode(privFile, &pem.Block{Type: "PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(priv)})

    // Save the certificate
    certFile, err := os.Create("certificate.pem")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer certFile.Close()
    pem.Encode(certFile, &pem.Block{Type: "CERTIFICATE", Bytes: certDER})

    fmt.Println("Certificate and private key generated!")
}

func main() {
    generateCertificate()
}
