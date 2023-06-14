// ===== LINK TO RELATED INCLUDES =====
import axios from "axios";                // Used to control API calls
import { readFile } from 'fs/promises';   // Used to read aggregatedData.json file
import { writeFile } from 'fs';           // Used to write aggregatedData.json file
import dotenv from 'dotenv';              // Used to load environment variables from a .env file
dotenv.config({ path: '.env'});           // Populate dotenv with environment data from .env file
import puppeteer from 'puppeteer';        // Used to control Chrome to scrape data not available via the TroopTrack API

export class TroopTrack {
  constructor(refreshData) {
    // populate the class variables
    this.url = process.env.ttURL;                   //The URL for the user's TroopTrack instance
    this.partnerToken = process.env.ttPartnerToken; //The user's Partner Token from the TroopTrack Developer Program
    this.username = process.env.ttUsername;         //The user's TroopTrack username
    this.password = process.env.ttPwd;              //The user's TroopTrack password
    this.sessionToken = '';                         //Placeholder for TroopTrack API session token
    this.data = '';                                 //Object to hold data pulled from TroopTrack
    this.households = [];                           //Object to hold list of Households and their members
  }
  
  async call_API(callType, apiEndpoint, myParameters) {
  /* ============================================================================================
     Input Variables:
      - callType    ('get', 'post')
      - apiEndPoint (URL stub appended to TroopTrack URL specified in .env file)
      - headers     (the headers to be passes to the TroopTrack URL as an object)

     Description: 
     Sends commands to TroopTrack API.

     Returns: JSON Response data from TroopTrack Query
     ============================================================================================ */
   
    var response = [];
    try {
      if (callType == 'post') { 
        response = await axios.post(`${this.url}${apiEndpoint}`, '', myParameters);
      } else if (callType == 'get') {
        response = await axios.get(`${this.url}${apiEndpoint}`, myParameters);
      }
      return await response.data;
    } catch (error) {
      throw new Error(`Error obtaining TroopTrack API Data: ${error}`);
    }
  }

  async getData(refreshData){
    /* ============================================================================================
      Input Variables:
        - refreshData (true or false)

      Description:
      Method used to update the .sessionToken and .data objects.  Session token is
      updated by querying the API.  The data object is refreshed by pulling from the 
      aggregateData.json file (refreshData = false) or by collecting the data from the API and 
      puppeteer interfaces.

      Returns: Nothing
      ============================================================================================ */    
    var my_params = {};

    // Always get TroopTrack Session Token
    {
      var my_params = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Partner-Token': this.partnerToken,
          'X-Username': this.username,
          'X-User-Password': this.password
        }
      };
      var result = await this.call_API('post','/api/v1/tokens',my_params);
      this.sessionToken = await result.users[0].token;
    } 

    // Determine if data refresh has been requested
    if (!refreshData) {
      // refreshData is false - populate .date from aggregatedData.json file
      this.data= JSON.parse(await readFile("aggregatedData.json", "utf8"));
    } else {
      // refreshData is true - requery systems and update aggregatedData.json file.

      // Common variable setup
      var rank_id = "";
      var req_id = "";
      var aggregatedData = [];
      var rankReqDesc = [];
      var my_params = {};
      var response = {};

      // ========== SCRAPE DATA FROM TROOPTRACK ==========
      const browser = await puppeteer.launch();     // USE PARAMETER { headless: false } FOR TESTING
      const page = await browser.newPage();
      
      {
        await page.goto(this.url + '/manage/users');

      // Login to TroopTrack
      {
        await page.waitForSelector('#user_account_session_login');
        await page.type('#user_account_session_login',this.username);
        await page.type('#user_account_session_password',this.password);
        await page.click('#new_user_account_session > input.btn.btn-secondary');
        await page.waitForNavigation();
      }

      // Scrape User IDs
      {
        var userInfo = await page.evaluate(() => {
        var rows = document.querySelectorAll('#DataTables_Table_1 > tbody tr'), i;
        var myUsers = [];
        for(i = 0; i < rows.length; ++i) {
          let uName = rows[i].children[1].textContent.replace("No user account","").replace("Register","").trim()
          
          myUsers.push({
            name: rows[i].children[0].children[0].children[0].textContent.trim(),
            user_id: /[^/]*$/.exec(rows[i].children[0].children[0].children[0].firstElementChild.getAttribute("href"))[0],
            user_name: uName
          });
        }
        return myUsers;
        });
      }

      // Scrape MB Counselors
      {
        await page.goto(this.url + '/manage/merit_badge_counselors');
        await page.waitForSelector('#DataTables_Table_0 > tbody tr');
        var MBs = await page.evaluate(() => {
          var rows = document.querySelectorAll('#DataTables_Table_0 > tbody tr'), i;
          var myMBs = [];
          for(i = 0; i < rows.length; ++i) {
            var myBadges = rows[i].children[1].textContent.split(',').map(function(item) {
              return item.trim();
            });
            
            myMBs.push({
              name: rows[i].children[0].children[0].textContent.trim(),
              user_id: /[^/]*$/.exec(rows[i].children[0].firstElementChild.getAttribute("href"))[0],
              badges: myBadges
            });
          }
          return myMBs;
        });
      }

      // Scrape Health Form Data
      {
        await page.goto(this.url + '/manage/medical_book');
        await page.waitForSelector('#DataTables_Table_0 > tbody tr');
        var healthForms = await page.evaluate(() => {
          var rows = document.querySelectorAll('#DataTables_Table_0 > tbody tr'), i;
          var myHealthForms = [];
          for(i = 0; i < rows.length; ++i) {
            myHealthForms.push({
                      name: rows[i].children[0].textContent.trim(),
                      user_id: /[^/]*$/.exec(rows[i].children[0].firstElementChild.getAttribute("href"))[0],
                      PartA: rows[i].children[1].textContent.trim(),
                      PartB: rows[i].children[2].textContent.trim(),
                      PartC: rows[i].children[3].textContent.trim(),
                  });
          }
          return myHealthForms;
        });
      }

      // ========== SCRAPE MOBILE CONFIG ==========
      {
        await page.goto(this.url + '/communicate/text_message_settings');
        await page.waitForSelector('#text_message_setting > tbody tr');
        var mobileConfig = await page.evaluate(() => {
          var rows = document.querySelectorAll('#text_message_setting > tbody tr'), i;
          var mobileConfig = [];
          for(i = 0; i < rows.length; ++i) {
            mobileConfig.push({
              user_id: rows[i].id.replace("user_",""),
              name: rows[i].children[0].children[0].children[2].children[1].textContent.trim(),
              cellPhone: rows[i].children[0].children[0].children[2].children[2].children[0].children[1].value,
              Provider: rows[i].children[0].children[0].children[2].children[3].children[0].children[1].value,
              optOut:  rows[i].children[0].children[0].children[2].children[4].children[0].children[1].hasAttribute('checked'),
              txtEnabled:  (rows[i].children[0].children[0].children[2].children[5].children[0].className == 'fa fa-check')
            });
          }
          return mobileConfig;
        });
      }
    }
      // ========== GET DATA FROM TROOPTRACK API ==========

      // GET TROOPTRACK PARAMETER DATA
      my_params = {
        method: 'get',
        headers: {
          'Accept': 'application/json',
          'X-Partner-Token': this.partnerToken,
          'X-User-Token': this.sessionToken
        }
      };
      let params = await this.call_API('get','/api/v1/user_achievements/parameters',my_params);

      // GET TROOPTRACK achievement descriptions
      for(var i = 0; i < params.award_types[1].achievements.length; ++i) {
        my_params = {
          headers: {
            'Accept': 'application/json',
            'X-Partner-Token': this.partnerToken,
            'X-User-Token': this.sessionToken
          }
        };
        var myURLStub = '/api/v1/achievements/' + params.award_types[1].achievements[i].id + '?award_type_id=' + params.award_types[1].id;
        var myDetails = await this.call_API('get',myURLStub,my_params);
        //myDetails = await myDetails.json();
        rankReqDesc.push(myDetails.achievement);
      }

      // ========= AGGREGATE COLLECTED DATA WITH USER DETAILS ==========

      for(var i = 0; i < params.users.length; ++i) {
        let myID = params.users[i].id;

        // API Call to obtain User Details
        my_params = {
          headers: {
            'Accept': 'application/json',
            'X-Partner-Token': this.partnerToken,
            'X-User-Token': this.sessionToken
          }
        };
        var myURLStub = '/api/v1/users/' + myID;
        let userData = await this.call_API('get',myURLStub,my_params);
        //let userData = await response.json();

        // Add Username Data
        let myUser = userInfo.find(({ user_id }) => user_id === myID.toString())
        if (myUser != null) { userData.user.user_name = (myUser.user_name);	} else { userData.user.user_name = ""; }
        
        // Add MB Counselor Data
        let myMBs = MBs.find(({ user_id }) => user_id === myID.toString())
        if (myMBs != null) { userData.user.counseled = (myMBs.badges); } else { userData.user.counseled = []; }

        // Add MB Counselor Data
        let myHF = healthForms.find(({ user_id }) => user_id === myID.toString())
        if (myHF != null) {
          if (myHF.PartA != null) { userData.user.PartA = (myHF.PartA); } else { userData.user.PartA = ""; }
          if (myHF.PartB != null) { userData.user.PartB = (myHF.PartB); } else { userData.user.PartB = ""; }
          if (myHF.PartC != null) { userData.user.PartC = (myHF.PartC); } else { userData.user.PartC = ""; }
        }

        // Add Mobile Config Information
        let myMobile = mobileConfig.find(({ user_id }) => user_id === myID.toString())
        if (myMobile != null) {
          if (myMobile.cellPhone != null) { userData.user.cellPhone = (myMobile.cellPhone); } else { userData.user.cellPhone = ""; }
          if (myMobile.Provider != null) { userData.user.Provider = (myMobile.Provider); } else { userData.user.Provider = ""; }
          if (myMobile.optOut != null) { userData.user.optOut = (myMobile.optOut); } else { userData.user.optOut = false; }
          if (myMobile.txtEnabled != null) { userData.user.txtEnabled = (myMobile.txtEnabled); } else { userData.user.txtEnabled = false; }
        }

        // Get Detailed Requirement Data
        for(var j = 0; j < userData.user.rank_trackers.length; ++j) {
          // API Call to obtain advancement details
          my_params = {
            headers: {
              'Accept': 'application/json',
              'X-Partner-Token': this.partnerToken,
              'X-User-Token': this.sessionToken
            }
          };
          var myURLStub = '/api/v1/user_achievements/' + userData.user.rank_trackers[j].user_achievement_id + '?award_type_id=' + userData.user.rank_trackers[j].award_type_id;
          var myReq = await this.call_API('get',myURLStub,my_params);
          // let myReq = await myReqs.json() || [];
          userData.user.rank_trackers[j].requirements = await myReq.user_achievement.descendants;

          for(k = 0; k < userData.user.rank_trackers[j].requirements.length; ++k) {
            // Add Requirement Description to Entry
            rank_id = userData.user.rank_trackers[j].achievement_id;
            req_id = userData.user.rank_trackers[j].requirements[k].achievement_id;
            var myDesc = rankReqDesc.filter(item => { return item[rank_id]; })
            myDesc = myDesc[0][rank_id];
            userData.user.rank_trackers[j].requirements[k].description = myDesc.children[req_id].description;

            // Update requirements.completed_on if requirements.completed_on = "" and  rank_trackers.completed_on <> ""
            if (userData.user.rank_trackers[j].completed_on != "") {
              for(var k = 0; k < userData.user.rank_trackers[j].requirements.length; ++k) {
                if (userData.user.rank_trackers[j].requirements[k].completed_on == "") {
                  userData.user.rank_trackers[j].requirements[k].completed_on = userData.user.rank_trackers[j].completed_on;
                }
              }
            };
          }
        };

        // Scrape Drivers License, BSA ID, Date Joined Troop
        await page.goto(this.url + '/manage/users/' + myID);
        await page.waitForSelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(3) > div.card-body > dd');
        
        // Get Drivers License
        var hasDL = await page.evaluate(() => { 
          const dlTag = document.querySelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(3) > div.card-body > dd')
          return dlTag.innerHTML; 
        });
        userData.user.hasDL = (hasDL.trim() != '-');

        if(userData.user.scout) {
          userData.user.BSA_id = await page.evaluate(() => { 
            var bsaID = document.querySelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(8) > div.card-body > dd:nth-child(4)');
            bsaID = bsaID.innerHTML.trim();
            return bsaID.replace("ID: ",""); 
          });
      
          userData.user.date_joined = await page.evaluate(() => { 
            var dtJoined = document.querySelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(8) > div.card-body > dd:nth-child(5)')
            dtJoined = dtJoined.innerHTML.trim(); 
            return dtJoined.replace("Joined on ",""); 
          });
        } else {
          userData.user.BSA_id = await page.evaluate(() => { 
            var bsaID = document.querySelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(9) > div.card-body > dd:nth-child(4)');
            bsaID = bsaID.innerHTML.trim();
            return bsaID.replace("ID: ",""); 
          });
      
          userData.user.date_joined = await page.evaluate(() => { 
            var dtJoined = document.querySelector('#main-container > div.border.border-top-0 > div > div > div:nth-child(9) > div.card-body > dd:nth-child(5)')
            dtJoined = dtJoined.innerHTML.trim(); 
            return dtJoined.replace("Joined on ",""); 
          });
        }
        aggregatedData.push(userData.user);
      }

      // OUTPUT AGGREGATED DATA TO TEXT FILE AS JSON
      writeFile('aggregatedData.json',JSON.stringify(aggregatedData), err => {
        if(err) {
          console.err;
          return;
        }
      });

      await browser.close();
      this.data = aggregatedData;
    }

    // Get unique list of Household
    const myHouseholds = this.data.map(item => item.households[0]);
    this.households = myHouseholds.filter((value, index) => {
      const _value = JSON.stringify(value);
      return index === myHouseholds.findIndex(obj => {
        return JSON.stringify(obj) === _value;
      });
    });

    // Add Household Members to list
    for(let i=0; i<this.households.length;i++){
      var currentHousehold = this.households[i].household_id;
      var householdMembers = this.data.filter(person => {
        const myPeople = person.households.filter(personsHousehold => {
            return personsHousehold.household_id == currentHousehold;
          })
        return myPeople.length>0;
        }); //person.house.contains(currentHousehold);
      this.households[i].members = householdMembers;
    }
  }

  async getCalendar(startDate, endDate) {
    var headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Partner-Token': this.partnerToken,
      'X-User-Token': await this.getToken()
    };
    var searchString = this.url + '/api/v1/events?start_on=' + startDate + '&end_on=' + endDate;

    try {
      const response = await axios.get(searchString, { headers: headers });
      return await response.data;
    } catch (error) {
      throw new Error('Error obtaining TroopTrack Session Token: ${error}');
    }
  }

  async sendEmail(msgArray) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(this.url + '/communicate/messages/new');

    // Login to TroopTrack
    await page.waitForSelector('#user_account_session_login');
    await page.type('#user_account_session_login',this.username);
    await page.type('#user_account_session_password',this.password);
    await page.click('#new_user_account_session > input.btn.btn-secondary');
    await page.waitForNavigation();
  
    var tmp = "";
    for(var i = 0; i < msgArray.length; ++i) {
       // Populate Subject
        tmp = msgArray[i].subject;
        await page.type('#message_subject',tmp);

        tmp = msgArray[i].recipients;
        // Populate Send To
        await page.evaluate((tmp) => {
          var element = document.getElementById('message_cc');
          element.style.display = 'block';
          
          for (var j = 0; j < element.options.length; j++) {
              element.options[j].selected = tmp.indexOf(element.options[j].value) >= 0;
          }
        },(tmp))

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
    // await browser.close();
  }


  // --- REWRITE THESE AT SOME POINT
  
  getPatrolList() {
      const patrolValues = new Set();
      
      this.data.forEach((item) => {
          if ((item.patrol !== undefined) && (item.patrol !== "Inactive") && (item.patrol !== "Unassigned") && (item.patrol !== "Eagle Patrol (inactive)") && (item.patrol !== "Rocking Chair Patrol"))
          { patrolValues.add(item.patrol); }
      });
  
      return Array.from(patrolValues).sort();
  }

  getPatrolPosition(patrolName,patrolPosition){
    var curDate = new Date();
    curDate.setHours(0, 0, 0, 0);     
    var tmp = this.data.filter(item => {
      let myPositions = item.leadership_positions.filter(pos => {
          return (((pos.name==patrolPosition)) && (Date.parse(pos.start_date)<=curDate) && (Date.parse(pos.end_date)>=curDate));
      });
      return (myPositions.length>0) && (item.patrol==patrolName)
    });
    return tmp[0].first_name + ' ' + tmp[0].last_name;
  }

  getTroopPositions() {
    var posList = [];
    var curDate = new Date();
    curDate.setHours(0, 0, 0, 0);     
    
    for(let i = 0; i<this.data.length; i++){
      if (this.data[i].scout) {
        var output = [];
        for(let j = 0; j<this.data[i].leadership_positions.length; j++){
          if(((this.data[i].leadership_positions[j].name != "Patrol Leader") && (this.data[i].leadership_positions[j].name != "Assistant Patrol Leader") && 
            (this.data[i].leadership_positions[j].name != "Senior Patrol Leader") && (this.data[i].leadership_positions[j].name != "Assistant Senior Patrol Leader")) && 
            (Date.parse(this.data[i].leadership_positions[j].start_date)<=curDate) && (Date.parse(this.data[i].leadership_positions[j].end_date)>=curDate))
              output.push(this.data[i].leadership_positions[j].name);
        }

        if(output != ""){
          posList.push(this.data[i].first_name + " " + this.data[i].last_name + " (" + output.join(" / ") + ")")
        }
      }
    }

    return posList;
  }
}
