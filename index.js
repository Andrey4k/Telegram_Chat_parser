const fs = require('fs'); // module for file manipulation

//Декларуєм дані
let chatId = '-777'; // ID Чата в якому будем парсити //id of the chat that we will parse
/* Defines PORT */
const express = require("express");
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("server listening in PORT", PORT);
});

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Замінити token='YOUR_TELEGRAM_BOT_TOKEN' на ваш API ключ БОТА(можна отримати в telegram@BotFather https://t.me/botfather)
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Create 
const bot = new TelegramBot(token, { polling: true });

// Function loading keywords from keywords.json
function loadKeywords() {
    try {
        const jsonData = fs.readFileSync('keywords.json', 'utf8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error loading keywords:', error);
        return { keywords: [] };
    }
}
// Function for save words in keywords.json file
function saveKeywords(keywords) {
    try {
        const jsonData = JSON.stringify(keywords, null, 2);
        fs.writeFileSync('keywords.json', jsonData, 'utf8');
        console.log(`Keywords ${keywords} saved successfully.`);
    } catch (error) {
        console.error('Error saving keywords:', error);
    }
}

let keywords = loadKeywords().keywords; //Loading keyword from our file with keywords;
let browser;

// Function for create new Page
async function createPage() {
    const puppeteer = require('puppeteer');
    // Check 
    if (!browser) {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:/Program Files/Google/Chrome/Application/Chrome.exe',
            userDataDir: 'C:/Users/Andrew/AppData/Local/Google/Chrome/User Data', //Directory for you chromeProfile
        });
    }
    const pages = await browser.pages();
    // if the page is open return this page or open new page
    return pages.length > 0 ? pages[0] : await browser.newPage();
}

// Processing commands in telegram
bot.on('text', async msg => {
    try {
        if(msg.text == '/start') {
            await bot.sendMessage(msg.chat.id, `Бот починає свою роботу, очікую вказівок`);
        }
        else if(msg.text == '/pars') {
            (async () => {
                
                let page;
                try {
                    page = await createPage();
                    // Go to our parsing page
        await page.goto(`https://web.telegram.org/a/#${chatId}`, { waitUntil: 'domcontentloaded' });

        
        // Waiting all message in chat
        await page.waitForSelector('.message-list-item');
        
        let chatMessages = await page.evaluate(() => {

            let text = Array.from(document.querySelectorAll('.message-list-item'), el => el.innerText) //Запис всіх повідомлень в масив
            return text;
        })
        chatMessages.forEach(text => {
            keywords.forEach(keyword => {
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                    bot.sendMessage(msg.chat.id, `Найшов ці слова///:--- ${keyword} --- в чаті ${text}, https://web.telegram.org/a/#${chatId}`);
                    keywordNotFound = false;
                }
            });
        });
        if (keywordNotFound) {
            console.log(`Ключових слів не знайдено`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (page) {
            await page.close();
        }
    }
})();
        }
        else if(msg.text.includes('/newId')) {
            chatIdtext = msg.text;
            chatId = parseInt(chatIdtext.replace("/newId", ""));
            await bot.sendMessage(msg.chat.id, `Парсити буду чат з ID https://web.telegram.org/a/#${chatId}`);
        }
        else if (msg.text.startsWith('/newWord')) {
            const words = msg.text.split(' ');
            if (words.length < 2 || !words[1]) {
                await bot.sendMessage(msg.chat.id, 'Не вказано ключове слово. Виконай команду /newWord Слово. ');
            } else {
                const newWord = words[1];
                keywords.push(newWord);
                saveKeywords({ keywords });
                await bot.sendMessage(msg.chat.id, `Слово "${newWord}" додано в список перевірки.`);
            }
        }
        else  {
            await bot.sendMessage(msg.chat.id, 'я не вкурсах такої команди, придумай щось папрощє');
            await bot.sendMessage(msg.chat.id, `Можеш використати команду /pars і я почну парсити чат з ID=${chatId}`);
            await bot.sendMessage(msg.chat.id, 'Змінити ID чату /newId-777888555 (замість цифр вписати свій ID чату)');
            await bot.sendMessage(msg.chat.id, 'Добавити нове перевірочне слово /newWord ...');            
        }
    }
    catch(error) {
        console.log(error);
    }
})
