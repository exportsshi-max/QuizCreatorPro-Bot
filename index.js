const { Telegraf, Markup, session } = require('telegraf');

// आपका API Token (Fixed as requested)
const bot = new Telegraf('8714081785:AAGfuzXgIJNaUrICPUknnAgFzDQxbkF8RwA');

bot.use(session());

// --- हेल्पर्स ---
const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// --- मुख्य मेनू ---
bot.start((ctx) => {
    ctx.replyWithMarkdown(`🛠 *Welcome to Advance Quiz Builder!* \n\nयहाँ आप @QuizBot की तरह लेकिन और भी आसानी से बल्क में क्विज़ बना सकते हैं।`,
        Markup.keyboard([['🆕 Create Bulk Quiz']]).resize());
});

// --- क्विज़ बनाने का फ्लो ---
bot.hears('🆕 Create Bulk Quiz', (ctx) => {
    ctx.session = { step: 'ASK_MARKS', quiz: { questions: [] } };
    ctx.reply("🔢 मार्किंग स्कीम चुनें (Correct, Negative):\nउदा: 3, 0.75");
});

bot.on('text', async (ctx) => {
    const state = ctx.session;
    if (!state) return;

    const input = ctx.text;

    // स्टेप 1: मार्क्स सेट करना
    if (state.step === 'ASK_MARKS') {
        const marks = input.split(',');
        state.quiz.pos = parseFloat(marks[0]) || 1;
        state.quiz.neg = parseFloat(marks[1]) || 0;
        state.step = 'ASK_TIMER';
        ctx.reply("⏱ हर सवाल के लिए कितना समय (Seconds) देना है?\nउदा: 15");
    }

    // स्टेप 2: टाइमर सेट करना
    else if (state.step === 'ASK_TIMER') {
        state.quiz.timer = parseInt(input) || 15;
        state.step = 'ASK_BULK_CONTENT';
        ctx.replyWithMarkdown("📝 *अब सवाल भेजें (Bulk Text):* \n\nनीचे दिए गए फॉर्मेट में सवाल पेस्ट करें:\n\n`Question? \nOption 1\nOption 2\nOption 3\nOption 4\nAns: 2` \n\n(आप एक साथ कई सवाल भेज सकते हैं या JSON फाइल भी अपलोड कर सकते हैं)");
    }

    // स्टेप 3: बल्क कंटेंट प्रोसेस करना
    else if (state.step === 'ASK_BULK_CONTENT') {
        parseBulkText(ctx, input);
    }
});

// --- टेक्स्ट से सवाल निकालने का लॉजिक ---
function parseBulkText(ctx, text) {
    const state = ctx.session;
    const lines = text.split('\n').filter(l => l.trim() !== "");
    
    // यह लॉजिक 6-6 लाइनों के ब्लॉक में सवाल तोड़ेगा
    for (let i = 0; i < lines.length; i += 6) {
        const qBlock = lines.slice(i, i + 6);
        if (qBlock.length >= 6) {
            state.quiz.questions.push({
                q: qBlock[0],
                options: [qBlock[1], qBlock[2], qBlock[3], qBlock[4]],
                correct: parseInt(qBlock[5].toLowerCase().replace('ans:', '').trim()) - 1
            });
        }
    }

    if (state.quiz.questions.length > 0) {
        state.step = 'READY';
        ctx.replyWithMarkdown(`✅ *Success!* \n\nकुल सवाल: ${state.quiz.questions.length}\nCorrect: +${state.quiz.pos} | Negative: -${state.quiz.neg}\nTimer: ${state.quiz.timer}s\n\nक्विज़ शुरू करने के लिए /start_test लिखें।`,
            Markup.keyboard([['🚀 Start Test']]).resize());
    } else {
        ctx.reply("❌ फॉर्मेट गलत है। कृपया ऊपर दिए गए फॉर्मेट में दोबारा भेजें।");
    }
}

// --- टेस्ट शुरू करना (Shuffle & Live) ---
bot.hears('🚀 Start Test', (ctx) => {
    const state = ctx.session;
    if (!state || state.step !== 'READY') return;

    state.questions = shuffle([...state.quiz.questions]); // शफलिंग
    state.currentQ = 0;
    state.userScore = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    
    sendLiveQuestion(ctx);
});

async function sendLiveQuestion(ctx) {
    const state = ctx.session;
    const q = state.questions[state.currentQ];

    const buttons = q.options.map((opt, i) => [Markup.button.callback(opt, `ans_${i}`)]);
    
    await ctx.replyWithMarkdown(`❓ *Question ${state.currentQ + 1}:* \n${q.q}`, 
        Markup.inlineKeyboard(buttons));

    // टाइमर ऑटो-हैंडल (अगले वर्जन में हम यहाँ 'Countdown' भी जोड़ेंगे)
}

bot.action(/ans_(\d+)/, async (ctx) => {
    const state = ctx.session;
    if (!state) return;

    const selected = parseInt(ctx.match[1]);
    const q = state.questions[state.currentQ];

    if (selected === q.correct) {
        state.userScore += state.quiz.pos;
        state.correctCount++;
        await ctx.answerCbQuery("✅ Correct!");
    } else {
        state.userScore -= state.quiz.neg;
        state.wrongCount++;
        await ctx.answerCbQuery("❌ Wrong!");
    }

    state.currentQ++;
    if (state.currentQ < state.questions.length) {
        sendLiveQuestion(ctx);
    } else {
        // फाइनल रिजल्ट शो करना
        ctx.replyWithMarkdown(`📊 *YOUR QUIZ RESULT* \n\n✅ Correct: ${state.correctCount}\n❌ Wrong: ${state.wrongCount}\n💰 Total Score: *${state.userScore.toFixed(2)}* \n\nJoin: @TargetSelection_NoExcuse`);
        state.step = 'IDLE';
    }
});

bot.launch();
console.log("Bulk Quiz Maker Live!");
