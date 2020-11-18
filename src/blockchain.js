const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    APP_NAME = 'starRegistry';

    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    async initializeChain() {
        if(this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    _addBlock(block) {
        let self = this;
        
        return new Promise(async (resolve, reject) => {
            try {
                self.height+=1
                block.height = self.height;
                block.time = new Date().getTime().toString().slice(0, -3);

                if (self.height > 0) {
                    block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                }

                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);

                resolve(block);
            } catch (error) {
                reject(error);
            }
        });
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            const currentTime = new Date().getTime().toString().slice(0,-3);
            const message = `${address}:${currentTime}:${this.APP_NAME}`;
            resolve(message);
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        const sendTime = parseInt(message.split(':')[1]);
        let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
        const elapsedTimeInMin = (currentTime - sendTime) / 60;
        const isMessageVerified = bitcoinMessage.verify(message, address, signature);

        return new Promise(async (resolve, reject) => {

            if (elapsedTimeInMin > 5) {
                reject(`Time elapsed is more that 5 min. Time elapsed: ${elapsedTimeInMin}`)
            }
            if (!isMessageVerified) {
                reject("Message was not verified. Please sign the message with your wallet.")
            }

            try {
                const block = new BlockClass.Block({
                    owner: address,
                    star: star
                });

                const addedBlock = await this._addBlock(block);
                resolve(addedBlock);
            } catch (error) {
                reject(error)
            }
        });
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                const blockFiltered = self.chain.filter(block => block.hash === hash)[0];
                resolve(blockFiltered)
            } catch (error) {
                reject(error)
            }
        });
    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                let block = self.chain.filter(p => p.height === height)[0];
                resolve(block);
            } catch (error) {
                reject(error)
            }
        });
    }

    getStarsByWalletAddress (address) {
        let self = this;
        let stars = []
        return new Promise((resolve, reject) => {
            try {
                self.chain.forEach(async block => {
                    const walletAddress = await block.getBData();
                        
                    if (block.height !== 0 && walletAddress.owner === address) {
                        stars.push(block);
                    }
                });
                resolve(stars);
            } catch (error) { 
                reject(error);
            }
        });
    }

    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            const lastBlock = self.chain[self.height];
            let block = lastBlock;

            while (block) {
                try {
                    const isValid = await block.validate();
                    if (!isValid) {
                        errorLog.push(block)
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    block = block.previousBlockHash
                }
            }

            resolve(errorLog);
        });
    }
}

module.exports.Blockchain = Blockchain;   