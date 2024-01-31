/* =======================================================================
    WORDPRESS.MJS

    Creates a Wordpress Class for performing tasks on the Troop website
    including:
      - 
   ======================================================================= */

// =============== IMPORTS ===============

import axios from 'axios';                // Used to make API calls to Wordpress
import { readFile } from 'fs/promises';   // Used to read aggregatedData.json file
import dotenv from 'dotenv';              // Used to load environment variables from a .env file
dotenv.config({ path: '.env'});           // Populate dotenv with environment data from .env file


export class WordPress {
  // ***** CONSTRUCTOR *****

  constructor() {
    // populate the class variables based on info from .env file
    this.username = process.env.WP_UserID;
    this.password = process.env.WP_KEY;
    this.url = process.env.WP_URL;
    this.wp_auth = process.env.WP_AUTH;
    this.tnlp_auth = process.env.TNLP_AUTH;
    this.tnlp_activeFamilies = 1;
    this.tnlp_EagleScouts = 2;
    this.tnlp_MBC = 10;
    this.tnlp_Alumni = 3;                     // FIXME: Change to List 8 after initial run.
  }

  // ***** createPost *****
  async createPost(post) {
    // Creates Meeting post on Troop Website

    try {
      const response = await axios.post(`${this.url}/wp-json/wp/v2/mtg`, post, { headers: {
        Authorization: "Basic " + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
          "Content-Type": "application/json" } });
      return response.data;
    } catch (error) {
      throw new Error(`Error while creating meeting: ${error}`);
    }
  }

  async createTTPermission(post) {
    // Creates Meeting post on Troop Website

    try {
      const response = await axios.post(`${this.url}/wp-json/wp/v2/trooptrack-access`, post, { headers: {
        Authorization: "Basic " + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
          "Content-Type": "application/json" } });
      return response.data;
    } catch (error) {
      throw new Error(`Error while creating meeting: ${error}`);
    }
  }

  async getFormSubmissions() {
    const myURL = `${this.url}/wp-json/elementor/v1/form-submissions`;
    const MB_Requests_To_Process = [];
  
    try {
      const response = await axios.get(myURL, { headers: this.headers });
      const submissions = response.data.data;
  
      for (const submission of submissions) {
        if (submission.form.name === "Blue Card Request") {
          const detailURL = `${this.url}/wp-json/elementor/v1/form-submissions/${submission.id}`;
          const detailResponseTmp = await axios.get(detailURL, { headers: this.headers });
          const detailResponse = detailResponseTmp.data;

          // Check if 'values' is defined and iterable
          if (detailResponse.data && detailResponse.data.values) {
            const extractValue = (key) => {
              const entry = detailResponse.data.values.find(v => v.key === key);
              return entry ? entry.value : null;
            };
  
            if (extractValue("Status") !== 'COMPLETED') {
              const requestDetails = {
                id: submission.id,
                first_name: extractValue("first_name"),
                last_name: extractValue("last_name"),
                merit_badge: extractValue("merit_badge"),
                need_counselor: extractValue("need_counselor"),
                comments: extractValue("comments"),
                Status: extractValue("Status")
              };
    
              MB_Requests_To_Process.push(requestDetails);
            }
          }
        }
      }
  
      return MB_Requests_To_Process;
    } catch (error) {
      throw new Error(`Error while requesting form submissions: ${error}`);
    }
  }

  async updateFormSubmission(responseID){
    
  }

  // ========== THE NEWSLETTER PLUGIN ==========
  // API Call Reference Information: https://www.thenewsletterplugin.com/documentation/api-reference/#/

    async getTNLPSubscriberList() {
      // Queries The Newsletter Plugin to return a list of Subscribers and associated details.
      // Includes email address, name, list membership, extra fields
      
      const url = `${this.url}/wp-json/newsletter/v2/subscribers?per_page=500&page=1`;
      try {
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Basic ${this.tnlp_auth}`,
            'User-Agent': 'HTTPBot-iOS/2024.0.1',
            'Accept': 'application/json'
          }
        });
        return response.data;
      } catch (error) {
        throw new Error(`Error while fetching WP Subscriber List: ${error}`);
      }
    }

    async updateSubscribers() {
      // Compares the TroopTrack user list (from aggregatedData.json) to the list of Newsletter Subscribers and performs newsletter
      // actions based on the comparison.
      //    1. User is in BOTH aggregatedData.json and Newsletter Subscriber list - Update the user's details in the Newsletter 
      //       Plugin and:
      //        a. Add Eagle Scouts to the Eagle Scout list
      //        b. Add Merit Badge Counselors to the MBC list
      //    2. User is in aggregatedData.json ONLY:  Add the user as a Subscriber in the Newsletter Plugin and a and b above 
      //       (where appropriate)
      //    3. User is in Newsletter Subscriber List ONLY: Remove the Subscriber from the Active Families list and add to the 
      //       Alumni list (unless the subscriber is an Eagle Scout)

      const aggregatedData = JSON.parse(await readFile('./data/aggregatedData.json', "utf8"));  // Read and parse the JSON files
      const wpSubscriberList = await this.getTNLPSubscriberList();                              // Fetch the WP Subscriber List from the API
      const noEmailList = [];                                                                   // Array to save users without associated email
      
      // Process each entry in aggregatedData
      aggregatedData.forEach(entry => {
          if (entry.household_members && Array.isArray(entry.household_members)) {
              entry.household_members.forEach(member => {
                const email = member.email.toLowerCase().trim();
                var myLists = [];
                var myExtras = [];

                if (!email) {
                  noEmailList.push(`${member.first_name} ${member.last_name}`);
                } else {
                    // Email is in both aggregatedData.json and WP_SubscriberList.json
                    // OR Email is only in aggregatedData.json but not WP_SubscriberList.json
                    // Update the member's information in Newsletter
                    myLists = [{id: this.tnlp_activeFamilies, value: 1}, {id:this.tnlp_Alumni, value: 0}];

                    // User is an Eagle Scout (include in Eagle Scout List)
                    if (member.current_rank.indexOf('Eagle')>=0){
                      myLists.push({id:this.tnlp_EagleScouts, value: 1});
                    }

                    // User is a Merit Badge Counselor (include in MBC List)
                    if (member.counseled.length>0) {
                      myLists.push({id: this.tnlp_MBC, value: 1});
                    }

                    // Add extra field information
                    myExtras = [{id: 2, value: member.patrol}, {id: 3, value: member.BSA_id}, {id: 4, value: member.counseled.join(', ')}];

                    // Determine if user is Adult or Youth
                    if (member.scout) {
                      myExtras.push({id: 1, value: 'Youth'});
                    } else {
                      myExtras.push({id: 1, value: 'Adult'});
                    }

                    setTimeout(() => { }, 500);
                    this.updateNewsletterSubscriber(member.email,member.first_name,member.last_name, myLists, myExtras);
                }
          });
          }
      });

      // Find and process emails that are only in WP_SubscriberList.json
      wpSubscriberList.forEach(subscriber => {
        const emailInAggregatedData = aggregatedData.some(entry => 
          entry.household_members && Array.isArray(entry.household_members) &&
          entry.household_members.some(member => member.email.toLowerCase() === subscriber.email)
        );
    
        // Check if the subscriber is a member of list 1
        const isMemberOfList1 = subscriber.lists.some(list => list.id === this.tnlp_activeFamilies);
        const isMemberOfList2 = subscriber.lists.some(list => list.id === this.tnlp_EagleScouts);

        if (!emailInAggregatedData) {
          if (isMemberOfList1) {
            // Remove from Active Families
            var myLists = [{id: this.tnlp_activeFamilies, value: 0}];

            // If Member of List 2 (Eagle Scouts) then DO NOTHING
            // ELSE Add to Alumni via Offboarding
            if (!isMemberOfList2) {
              myLists.push({id: this.tnlp_Alumni, value: 1}); // Add to Troop 457 Alumni List
              myLists.push({id: this.tnlp_EagleScouts, value: 0}); // Remove from Eagle List
              console.log(`${subscriber.email} - REMOVED FROM Active Families and ADDED TO ALUMNI`);
            } else {
              myLists.push({id: this.tnlp_Alumni, value: 0}); // Remove to Troop 457 Alumni List
              myLists.push({id: this.tnlp_EagleScouts, value: 1}); // Add from Eagle List
              console.log(`${subscriber.email} - REMOVED FROM Active Families`);
            }

            setTimeout(() => { }, 500);
            this.updateNewsletterSubscriber(subscriber.email,subscriber.first_name,subscriber.last_name, myLists);
          }
        }
      });
    
      console.log("NO EMAILS", noEmailList.toString());
    }

    async updateNewsletterSubscriber(email, firstName, lastName, lists, extraFields) { 
      // Sends PUT command to The Newsletter Plugin to add or update Subscriber Information
      var data = undefined;

      if (extraFields === undefined) {
        data = {
          email: email,
          first_name: firstName,
          last_name: lastName,
          lists: lists,
          extra_fields: extraFields,
          status: "confirmed"
        };
      } else {
        data = {
          email: email,
          first_name: firstName,
          last_name: lastName,
          lists: lists,
          status: "confirmed"
        };
      }

        const url = `${this.url}/wp-json/newsletter/v2/subscribers/${email}`;
        const headers = {
            'Authorization': `Basic ${this.tnlp_auth}`,
            'User-Agent': 'HTTPBot-iOS/2022.2.1',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        try {
          const response = await axios.put(url, data, { headers: headers });
        } catch (error) {
          console.error(`Error updating subscriber: ${firstName} ${lastName} (${email})`, error.response ? error.response.data : error.message);
        }
    }
}

