// release_paypal_example.js
// Example serverless function that would release 85% to seller after 3 days.
// THIS IS A TEMPLATE. You must host this on a secure server with PayPal Server SDK and your PayPal credentials.
// The logic: when an order is created, store order with 'pending' payout. After 3 days, call PayPal Payouts API to pay seller 85%
// This file is illustrative only.
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
app.use(bodyParser.json());

// CONFIG - fill these from your secure env vars
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'PASTE_CLIENT_ID';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'PASTE_SECRET';
const PAYPAL_BASE = 'https://api-m.paypal.com'; // or sandbox: https://api-m.sandbox.paypal.com

async function getAccessToken(){
  const res = await fetch(PAYPAL_BASE + '/v1/oauth2/token', {
    method:'POST', headers:{'Authorization':'Basic '+Buffer.from(PAYPAL_CLIENT_ID+':'+PAYPAL_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'}, body:'grant_type=client_credentials' });
  const j = await res.json(); return j.access_token;
}

// Example endpoint to be called by your scheduler (after 3 days) with order info
app.post('/release-payout', async (req,res)=>{
  const { orderId, sellerPaypalEmail, amount } = req.body;
  if(!orderId || !sellerPaypalEmail || !amount) return res.status(400).json({error:'missing fields'});
  try{
    const token = await getAccessToken();
    // Build payout body per PayPal Payouts API
    const payoutBody = {
      sender_batch_header: { recipient_type: 'EMAIL', email_message: 'Payout from Silky Road', note: 'Thanks for selling', sender_batch_id: 'batch_' + Date.now() },
      items: [ { recipient_type: 'EMAIL', amount: { value: (amount).toFixed(2), currency: 'USD' }, receiver: sellerPaypalEmail, note: 'Seller payout' } ]
    };
    const pRes = await fetch(PAYPAL_BASE + '/v1/payments/payouts', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(payoutBody) });
    const pJson = await pRes.json();
    return res.json({ok:true, data:pJson});
  }catch(err){ console.error(err); return res.status(500).json({error:String(err)}) }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on',PORT));
