const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

	constructor(data){
		this.hash = null;                                           
		this.height = 0;                                            
		this.body = Buffer(JSON.stringify(data)).toString('hex');   
		this.time = 0;                                              
		this.previousBlockHash = null;                              
    }
    
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                const auxiliaryHash = self.hash.slice();     
                self.hash = null;
                const calculatedHash = SHA256(JSON.stringify(self)).toString();
                self.hash = auxiliaryHash;
    
                (auxiliaryHash === calculatedHash) ? resolve(true) : resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }

    getBData() {
        return new Promise((resolve, reject) => {
            try {
                const encodedData = this.body;
                const decodedData = hex2ascii(encodedData);
                const parsedData = JSON.parse(decodedData);
                this.height === 0 ? resolve(null) : resolve(parsedData);
            } catch (error) {
                reject(error)
            }
        })
    }
}

module.exports.Block = Block;