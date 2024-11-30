import * as crypto from 'crypto'
import {generateKeyPairSync} from 'crypto'

const generateKeyPair = ():{publicKey: string; privateKey: string}=>{
    const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa',{
        modulusLength: 2048, // Key size in bits
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    })

    return { publicKey, privateKey }
}

export default generateKeyPair