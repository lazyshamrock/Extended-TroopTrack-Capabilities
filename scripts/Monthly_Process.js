// ===== IMPORT STATEMENTS =====
import { TroopTrack } from './TroopTrack.mjs';
import { WordPress } from './WordPress.mjs';

// ===== SCOUTBOOK  =====
/* Pull Data from Scoutbook to reconcile to TroopTrack
    - Merit Badge Counselors
    - Training Information
    - Leaders / Members
*/

// ===== TROOPTRACK =====
const tt = new TroopTrack();    // Create a TroopTrack object for processing
await tt.getData(true);         // Pull latest TroopTrack data and save to aggregatedData.json

// ===== WORDPRESS =====
const wp = new WordPress();     // Create a WordPres object for processing
wp.updateSubscribers();         // Update Newsletter Subscribers in Wordpress based on data from TroopTrack