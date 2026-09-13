import { Bot } from "gramio";
import { startWatching } from "./index";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID!; // your numeric Telegram chat id

const bot = new Bot(process.env.BOT_TOKEN!)
  .command("start", (ctx) => ctx.send("Hello sir how are you there"))
  .onStart(({ info }) => {
    console.log(`Running as @${info.username}`);

    startWatching((text) => {
      bot.api.sendMessage({ chat_id: CHAT_ID, text });
    });
  });

bot.start();

//Just fuck the code fuck the ai fuckk the money 
//Ath this point i am really so frustated 
//First thing i don't have maney to buy the key and test this shit 
//And after like giving 2 hours i am still not able to figure out how this makes snese
//Fuck it just fuck it 