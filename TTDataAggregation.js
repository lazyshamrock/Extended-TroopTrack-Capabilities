// ===== LINK TO RELATED INCLUDES =====
import dotenv from 'dotenv'; // Import the dotenv library to load environment variables from a .env file
dotenv.config({ path: '.env'});
import fs from 'fs';
import puppeteer from 'puppeteer';

// ===== CREATE COMMON VARIABLES =====
const ttPartnerToken = process.env.ttPartnerToken;
const ttUsername = process.env.ttUsername;
const ttPwd = process.env.ttPwd;
const ttURL = process.env.ttURL;
var selectorID = 0;
var rank_id = "";
var req_id = "";

async function TT_API_Call(my_params,api_endpoint) {
    let response = await fetch(ttURL + api_endpoint, my_params);
	let myJSON = await response.json();
	return myJSON;
}

(async function run() {
	var aggregatedData = [];
	var userInfo = [];
	var MBs = [];
	var healthForms = [];
	var rankReqDesc = [];
	var my_params = {};
	var response = {};

	// ========== SCRAPE DATA FROM TROOPTRACK ==========
	const browser = await puppeteer.launch(); 
	// const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
	await page.goto(ttURL + '/manage/users');

	// Login to TroopTrack
	await page.waitForSelector('#user_account_session_login');
	await page.type('#user_account_session_login',ttUsername);
	await page.type('#user_account_session_password',ttPwd);
	await page.click('#new_user_account_session > input.btn.btn-secondary');
	await page.waitForNavigation();

	// Scrape User IDs
	userInfo = await page.evaluate(() => {
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

	// Scrape MB Counselors
	await page.goto(ttURL + '/manage/merit_badge_counselors');
	await page.waitForSelector('#DataTables_Table_0 > tbody tr');
	MBs = await page.evaluate(() => {
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

	// Scrape Health Form Data
	await page.goto(ttURL + '/manage/medical_book');
	await page.waitForSelector('#DataTables_Table_0 > tbody tr');
	healthForms = await page.evaluate(() => {
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

	// ========== SCRAPE MOBILE CONFIG ==========
	

	// ========== GET DATA FROM TROOPTRACK API ==========
	// GET TROOPTRACK SESSION TOKEN
	my_params = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'X-Partner-Token': ttPartnerToken,
			'X-Username': ttUsername,
			'X-User-Password': ttPwd
        }
	};
    response = await TT_API_Call(my_params, '/api/v1/tokens');
	let ttToken = await response.users[0].token;

	// GET TROOPTRACK PARAMETER DATA
	my_params = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'X-Partner-Token': ttPartnerToken,
			'X-User-Token': ttToken
        }
	};
	let params = await TT_API_Call(my_params, '/api/v1/user_achievements/parameters');

	// GET TROOPTRACK achievement descriptions
	for(var i = 0; i < params.award_types[1].achievements.length; ++i) {
		var myDetails = await fetch(ttURL + '/api/v1/achievements/' + params.award_types[1].achievements[i].id + '?award_type_id=' + params.award_types[1].id, {
			headers: {
				'Accept': 'application/json',
				'X-Partner-Token': ttPartnerToken,
				'X-User-Token': ttToken
			}
		});
		myDetails = await myDetails.json();
		rankReqDesc.push(myDetails.achievement);
	}

	// ========= AGGREGATE COLLECTED DATA WITH USER DETAILS ==========
	for(var i = 0; i < params.users.length; ++i) {
		let myID = params.users[i].id;

		// API Call to obtain User Details
		response = await fetch(ttURL + '/api/v1/users/' + myID, {
			headers: {
			  'Accept': 'application/json',
			  'X-Partner-Token': ttPartnerToken,
			  'X-User-Token': ttToken
			}
		  });
		let userData = await response.json();

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

		// Get Detailed Requirement Data
		for(var j = 0; j < userData.user.rank_trackers.length; ++j) {
			// API Call to obtain advancement details
			let myReqs = await fetch(ttURL + '/api/v1/user_achievements/' + userData.user.rank_trackers[j].user_achievement_id + '?award_type_id=' + userData.user.rank_trackers[j].award_type_id, {
				headers: {
					'Accept': 'application/json',
					'X-Partner-Token': ttPartnerToken,
					'X-User-Token': ttToken
				}
			});

			let myReq = await myReqs.json() || [];
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
		await page.goto(ttURL + '/manage/users/' + myID);
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
	fs.writeFile('aggregatedData.json',JSON.stringify(aggregatedData), err => {
		if(err) {
			console.err;
			return;
		}
	});

	await browser.close();
})();