// ===== LINK TO RELATED INCLUDES =====
import { readFile } from 'fs/promises';   // Used to read aggregatedData.json file
import { writeFile } from 'fs';           // Used to write aggregatedData.json file
import dotenv from 'dotenv';              // Used to load environment variables from a .env file
dotenv.config({ path: '.env'});           // Populate dotenv with environment data from .env file
import puppeteer from 'puppeteer';        // Used to control Chrome to scrape data not available via the TroopTrack API
import { checkServerIdentity } from 'tls';

export class Scoutbook {
  constructor(refreshData) {
    // populate the class variables
    this.url = "https://scoutbook.scouting.org";     //The URL for the user's TroopTrack instance
    this.username = process.env.sbUsername;         //The user's TroopTrack username
    this.password = process.env.sbPwd;              //The user's TroopTrack password
    this.unit = process.env.sbUnit;
    this.council = process.env.sbCouncil;
    this.district = process.env.sbDistrict;
    this.zip = process.env.sbZipCode;
    this.MBCdata = '';                                 //Object to hold data pulled from TroopTrack
  }
  
  async getMBCData(refreshData){
    /* ============================================================================================
      Input Variables:
        - refreshData (true or false)

      Description:
      

      Returns: Nothing
      ============================================================================================ */    


    // Determine if data refresh has been requested
    if (!refreshData) {
      // refreshData is false - populate .date from MBC.json file
      this.MBCdata= JSON.parse(await readFile("./data/MBC.json", "utf8"));
    } else {
        // refreshData is true - requery systems and update MBC.json file.
        const initialUrl = this.url + '/mobile/dashboard/admin/counselorresults.asp?UnitID=' + this.unit + '&MeritBadgeID=&formfname=&formlname=&zip=' + this.zip + '&formCouncilID=' + this.council + '&formDistrictID=' + this.district + '&formWorldwide=1&Proximity=50&Availability=Both'

        // Start the browser in headless mode to check the URL
        let browser = await puppeteer.launch({ headless: false });
        let page = await browser.newPage();
      
        // Navigate to the webpage
        await page.goto(initialUrl);
      
        // Once the browser is visible and on the correct page, find and click the 'Login' link
        await page.waitForSelector('#btnLogin a[title="Login"]'); // Wait for the link to be available
        await page.click('#btnLogin a[title="Login"]'); // Click the link
    
        // Wait for the login input fields to be available and visible
        await page.waitForSelector('#email', { visible: true });
        await page.waitForSelector('#password', { visible: true });

        // Clear any pre-filled values in the input fields
        await page.evaluate(() => document.querySelector('#email').value = '');
        await page.evaluate(() => document.querySelector('#password').value = '');

        // Type the username and password into the input fields
        await page.type('#email', this.username);
        await page.type('#password', this.password);
        await page.click('#buttonSubmit');

        // Wait for the user to log in. This will wait indefinitely until the condition is true.
        await page.waitForFunction(url => window.location.href === url, { timeout: 0 }, initialUrl);

        // Extract number of counselors returned
        // Get number of records returned
        // Wait for the page content to load or for a specific element that contains the number
        // await page.waitForSelector('body');

        const regex = /Results: <strong>(.*)<\/strong>/;
        const totalMBCs = await page.evaluate((regexString) => {
          const bodyHTML = document.body.innerHTML;
          const regex = new RegExp(regexString);
          const matches = bodyHTML.match(regex);
          return matches && matches[1] ? matches[1] : null;
        }, regex.source); // Passing regex.source to convert the regex to a string for evaluate()

        // Calculate the total number of full pages
        let numFullPages = Math.floor(totalMBCs / 10);

        // Calculate the number of items on the last page
        let numLastPage = totalMBCs % 10;

        // Calculate the total number of pages
        let numPages = numFullPages + (numLastPage > 0 ? 1 : 0);
        console.log("Number of Pages",numFullPages);
        console.log("Number of Items on Last Page", numLastPage);
        console.log("Number of Full Pages",numPages);

        // Wait for the first element of the list to ensure the page has loaded
        await page.waitForSelector('div.ui-content > ul > li:nth-child(1)');

        let membersData = [];

        for (let i = 1; i <= 10; i++) {
          const memberIdSelector = `div.ui-content > ul > li:nth-child(${i}) > div > div.photoDIV > img`;
          const memberID = await page.evaluate((sel) => {
              const element = document.querySelector(sel);
              return element ? element.getAttribute('data-memberid') : null;
          }, memberIdSelector);
  
          const addressSelector = `div.ui-content > ul > li:nth-child(${i}) > div > div:nth-child(n) > div.address`;
          const address = await page.evaluate((sel) => {
              const element = document.querySelector(sel);
              return element ? element.innerText : null;
          }, addressSelector);
  
          if (MBC && address) {
              membersData.push({ bsa_id: memberID, address: address });
          }
      }
  
      console.log("Members Data:", membersData);
  
      await browser.close();
      /*
      aggregatedData = Array.from(uniqueHouseholds.values());

      // OUTPUT AGGREGATED DATA TO TEXT FILE AS JSON
      writeFile('./data/MBC.json',JSON.stringify(aggregatedData), err => {
        if(err) {
          console.err;
          return;
        }
      });
      this.MBCdata = aggregatedData; */
    }
  }
}
