import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm@0.2.79';

const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';

const statusEl = document.getElementById('status');
const chatEl = document.getElementById('chat');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');

let engine = null;
let isFirstMessage = true;

// تاریخچه چت برای حفظ حافظه
const chatHistory = [
    {
        role: 'system',
        content: 'تو نادی هستی، یک دستیار هوشمند فارسی‌زبان. دوستانه، کوتاه و مفید جواب بده. همیشه فارسی جواب بده.'
    }
];

async function init() {
    // SDK ایتا
    if (typeof window.Eitaa?.WebApp !== 'undefined') {
        window.Eitaa.WebApp.ready();
        console.log('SDK ایتا فعال شد');
    }

    // چک WebGPU
    if (!navigator.gpu) {
        statusEl.textContent = 'مرورگر پشتیبانی نمی‌کند';
        return;
    }

    try {
        statusEl.textContent = 'در حال دانلود مدل...';

        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (report) => {
                const pct = Math.round(report.progress * 100);
                statusEl.textContent = `دانلود مدل: ${pct}%`;
            }
        });

        statusEl.textContent = 'آماده‌ام! بپرس ✨';
        promptEl.disabled = false;
        sendBtn.disabled = false;
        promptEl.focus();
    } catch (err) {
        statusEl.textContent = 'خطا در بارگذاری';
        console.error(err);
    }
}

function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
    return msg;
}

function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'message ai';
    msg.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
    return msg;
}

async function sendMessage() {
    const text = promptEl.value.trim();
    if (!text || !engine) return;

    // حذف پیام خوش‌آمد در اولین پیام
    if (isFirstMessage) {
        const welcome = chatEl.querySelector('.welcome');
        if (welcome) welcome.remove();
        isFirstMessage = false;
    }

    addMessage(text, 'user');
    promptEl.value = '';
    sendBtn.disabled = true;

    const typingEl = addTyping();

    try {
        chatHistory.push({ role: 'user', content: text });

        const reply = await engine.chat.completions.create({
            messages: chatHistory,
            temperature: 0.7,
            max_tokens: 512
        });

        const aiText = reply.choices[0].message.content;
        chatHistory.push({ role: 'assistant', content: aiText });

        // محدود کردن تاریخچه برای سرعت
        if (chatHistory.length > 12) {
            chatHistory.splice(1, 2);
        }

        typingEl.remove();
        addMessage(aiText, 'ai');
    } catch (err) {
        typingEl.remove();
        addMessage('متأسفم، خطایی رخ داد. دوباره امتحان کن.', 'ai');
        console.error(err);
    }

    sendBtn.disabled = false;
    promptEl.focus();
}

sendBtn.addEventListener('click', sendMessage);
promptEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

init();