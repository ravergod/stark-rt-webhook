require('dotenv').config();
const serverless = require("serverless-http");
const express = require("express");
const starkbank = require("starkbank");
const app = express();

// create the starkbank.Project object for credentials usage
const project = new starkbank.Project({
  environment: process.env.STARKBANK_ENVIRONMENT,
  id: process.env.STARKBANK_PROJECT_ID,
  privateKey: process.env.STARKBANK_KEY.replace(/\n/g,"")
});

// set the user in the starkbank sdk using the starkbank.Project object created
starkbank.setUser(project);

app.use(express.json());

app.post("/tr-webhook", async (req, res, next) => {
  const data = req.body.event;
  const generatedTransfer = generateTransfer(data.log.invoice);

  try {
    const transfer = await starkbank.transfer.create([generatedTransfer]);
    console.log(`Transfer executed successfully. TransferInfo: ${JSON.stringify(transfer)}`);
    return res.status(201).json({
      data: transfer
    });
  } catch (e) {
    console.log(`The transfer was not executed properly. TransferInfo: ${JSON.stringify(generatedTransfer)}`);
    return res.status(500).json({
      error: e.message
    })
  } 
});

/**
 * Generate a transfer
 * @param {starkbank.Invoice} invoice
 * @returns {starkbank.Transfer} transfer
 */
const generateTransfer = (invoice) => {
  return {
    amount: invoice.amount - invoice.fee,
    name: 'Stark Bank S.A.',
    taxId: '20.018.183/0001-80',
    bankCode: '20018183',
    branchCode: '0001',
    accountNumber: '6341320293482496',
    accountType: 'payment'
  }
}

module.exports.handler = serverless(app);
