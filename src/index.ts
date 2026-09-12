/**
 * Monitor a single X (Twitter) account's tweet activity via TwitterAPI.io,
 * a third-party service (not affiliated with X Corp).
 *
 * Flow:
 *   1. Create a filter rule ("from:<handle>")
 *   2. Activate it
 *   3. Open a WebSocket and log every matching tweet as it arrives
 *
 * Docs: https://docs.twitterapi.io
 * Requires: npm install ws
 */

import WebSocket from 'ws';

const API_KEY = process.env.TWITTERAPI_KEY ?? '';
const TARGET_HANDLE = 'someuser'; // no "@"
const RULE_TAG = `watch_${TARGET_HANDLE}`;

if (!API_KEY) {
  throw new Error('Set TWITTERAPI_KEY in your environment before running this.');
}

//It simply helps you to add which account you wanna keep eye on just give the details in the json format 
async function addRule(): Promise<string> {
  const res = await fetch('https://api.twitterapi.io/oapi/tweet_filter/add_rule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify({
      tag: RULE_TAG,
      value: `from:${TARGET_HANDLE}`,
      interval_seconds: 60, // how often TwitterAPI.io checks, 0.05–86400
    }),
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(`add_rule failed: ${data.msg}`);
  console.log(`Rule created: ${data.rule_id}`);
  return data.rule_id;
}

//For active and update connection we have only one endpoint by calling this and passing the same value
//we can make our connection active or update it
async function activateRule(ruleId: string): Promise<void> {
  const res = await fetch('https://api.twitterapi.io/oapi/tweet_filter/update_rule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify({
      rule_id: ruleId,
      tag: RULE_TAG,
      value: `from:${TARGET_HANDLE}`,
      interval_seconds: 60,
      is_effect: 1, // 1 = active
    }),
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(`update_rule failed: ${data.msg}`);
  console.log('Rule activated.');
}


//For this one there is no direct link btwnn activeRule and this one, all the magic happens cause of API
//It's just when you send the connection request the api is the key and you are authorized to do the activity 
function connectStream(): void {
    //We make an instance 
  const ws = new WebSocket('wss://ws.twitterapi.io/twitter/tweet/websocket', {
    headers: { 'x-api-key': API_KEY },
  });

  //we open a connection 
  ws.on('open', () => console.log('WebSocket connected.'));

  //we subscribe for an event 
  ws.on('message', (raw) => {
    const event = JSON.parse(raw.toString());

    //If the event is connected then this 
    switch (event.event_type) {
      case 'connected':
        console.log('Handshake confirmed — stream is live.');
        break;

        //if the ping then this 
      case 'ping':
        // heartbeat, nothing to do
        break;

        //if they tweeted then this 
      case 'tweet':
        for (const tweet of event.tweets ?? []) {
          console.log(
            `🐦 @${tweet.author?.username ?? TARGET_HANDLE}: ${tweet.text}`
          );
        }
        break;

      default:
        console.log('Unhandled event:', event);
    }
  });

  ws.on('close', (code) => console.log('Connection closed. Code:', code));
  ws.on('error', (err) => console.error('WebSocket error:', err));
}

async function main() {
  const ruleId = await addRule();
  await activateRule(ruleId);
  connectStream();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});