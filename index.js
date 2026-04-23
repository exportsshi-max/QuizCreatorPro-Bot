const { Telegraf } = require('telegraf');

// आपका API Token यहाँ सेट कर दिया गया है
const bot = new Telegraf('8714081785:AAGfuzXgIJNaUrICPUknnAgFzDQxbkF8RwA'); 

bot.start((ctx) => {
    ctx.reply('नमस्ते! मैं ExamQuizMaker हूँ। मैं आपके लिए एडवांस्ड क्विज़ बनाने के लिए तैयार हूँ। 🚀');
});

bot.help((ctx) => {
    ctx.reply('मैं नेगेटिव मार्किंग, टाइमर और सेक्शन वाले क्विज़ बनाने में आपकी मदद करूँगा।');
});

bot.launch();
console.log('ExamQuizMaker Bot is running successfully!');

// टेलीग्राम बॉट क्रैश न हो इसके लिए ये कोड जरूरी है
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
