// ===== LINK TO RELATED INCLUDES =====
import dotenv from 'dotenv'; // Import the dotenv library to load environment variables from a .env file
dotenv.config({ path: '.env'});
import minimist from 'minimist';
import {TroopTrack} from './TroopTrack.mjs';

// ===== CREATE TROOPTRACK OBJECT =====
const ttConfig = {
    ttPartnerToken: process.env.ttPartnerToken,
    ttUsername: process.env.ttUsername,
    ttPwd: process.env.ttPwd,
    ttURL: process.env.ttURL
};
const tt = new TroopTrack(ttConfig);
tt.getAggregatedData();

// Recast Data by Household
/* Iterate through to ID issues
    - Health Form expired / expiring within 40 days
    - Negative Money Account / Money Account below desired threshold (configurable)
    - Adults with accounts that are not configured to receive text messages from the Troop
    - Adults / Scouts with shared email addresses.
    - Adults without BSA ID number assigned or BSA ID number without leadership position assigned (We use this information to determine if the adult is eligible to campout overnight with Scouts after 9/1/2023) */

var households = tt.getHouseholdData();
console.log("Households: " + households);