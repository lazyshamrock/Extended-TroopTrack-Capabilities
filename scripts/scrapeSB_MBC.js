// ===== LINK TO RELATED INCLUDES =====
import dotenv from 'dotenv'; // Import the dotenv library to load environment variables from a .env file
dotenv.config({ path: '.env'});
import fs from 'fs';
import puppeteer from 'puppeteer';

// ===== CREATE COMMON VARIABLES =====


(async function run() {
	// ========== SCRAPE DATA FROM TROOPTRACK ==========
	// const browser = await puppeteer.launch(); 
	const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
	
    // Navigate to MB Counselor List
    // https://scoutbook.scouting.org/mobile/dashboard/admin/counselorlist.asp?UnitID=8501

    // Check if logged in (if not, login)
    // Set Distance to 25 miles
    // #form1 > ul > li.ui-li.ui-li-static.ui-btn-up-d.ui-last-child > div.ui-icon-alt > fieldset:nth-child(5) > div.ui-controlgroup-controls > div:nth-child(3) > label

    // Click Search
    // #buttonSubmit

    // check value of this input to get number of pages
    // <input type="hidden" name="pageCount" id="pageCount" value="18">

    // Iterate through each item in the following list
    // #Page51566 > div.ui-content > ul

    // #Page51566 > div.ui-content > ul > li.ui-li.ui-li-static.ui-btn-up-d.ui-first-child > div > div:nth-child(3)
    // #Page51566 > div.ui-content > ul > li:nth-child(2) > div > div:nth-child(3)

    // Iterate through each MB
    // #Page51566 > div.ui-content > ul > li:nth-child(2) > div > div:nth-child(3) > div.mbContainer > div:nth-child(2)

})
