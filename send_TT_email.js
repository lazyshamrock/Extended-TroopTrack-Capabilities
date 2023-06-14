"use strict";
require('dotenv').config();

/* const index = await page.evaluate(() => {
    const elements = document.querySelectorAll('select#locationIdentifier > option');

    for(let index = 0; index < elements.length; ++ index) {
        const text = elements[index].innerText;

            if(text === 'CITY NAME') {
                return index + 1;
            }
        }

        return -1;
    });

    if(index === -1) {
        // Error
        console.log(`Error: Failed to find CITY NAME option`);
    }
    else {
        const tmpString = 'select#locationIdentifier > option:nth-child(' + index + ')';
        await page.click(tmpString);
    } */

const testMsg = [{
    subject: 'Testing',
    recipients: ['846836','663708'],
    messageBody: '<p>TEST</p>',
    attachmentPaths: [],
    autosend: false
}]

const puppeteer = require('puppeteer');
const ttUsername = process.env.ttUsername;
const ttPwd = process.env.ttPwd;
const ttURL = process.env.ttURL;

async function sendTTMessages(msgArray) {
    const browser = await puppeteer.launch({headless: false});
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
	await page.goto(ttURL + '/communicate/messages/new');

	// Login to TroopTrack
	await page.waitForSelector('#user_account_session_login');
	await page.type('#user_account_session_login',ttUsername);
	await page.type('#user_account_session_password',ttPwd);
	await page.click('#new_user_account_session > input.btn.btn-secondary');
    await page.waitForNavigation();
	
    console.log(msgArray);
    var tmp = "";
    for(var i = 0; i < msgArray.length; ++i) {
        // console.log(msgArray[i]);

        // Populate Subject
        tmp = msgArray[i].subject;
        await page.type('#message_subject',tmp);

        // Populate Send To
        await page.evaluate((msgArray, i) => {
            var element = document.getElementById('#message_cc');
            element.style.display = 'block';

            for (var j = 0; j < element.options.length; j++) {
                element.options[j].selected = msgArray[i].recipients.indexOf(element.options[j].value) >= 0;
            }
        })

        // Populate Message Body
        await page.click('#moreMisc-1');
        await page.waitForSelector('#html-1');
        await page.click('#html-1');
        tmp = msgArray[i].messageBody;
        await page.type('#new_message > div > div > div:nth-child(2) > div.form-group > div > div.fr-wrapper.show-placeholder > textarea',tmp)
        await page.click('#html-1');

        // Add Attachments 

        // SEND MESSAGE
        //'#new_message > div > div > div:nth-child(2) > div:nth-child(3) > input'
        // await page.click('#new_message > div > div > div:nth-child(2) > div:nth-child(3) > input')
    }
    console.log("END")
    // await browser.close();
}

sendTTMessages(testMsg);