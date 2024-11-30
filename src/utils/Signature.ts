import * as crypto from 'crypto'

const signWithPrivateKey = (hash: string, privateKey: string): string => {
    const sign = crypto.createSign("SHA256");
    sign.update(hash);
    sign.end();
    return sign.sign(privateKey, "hex");
};

export default signWithPrivateKey