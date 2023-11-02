// ===== LINK TO RELATED INCLUDES =====
import dotenv from 'dotenv'; // Import the dotenv library to load environment variables from a .env file
dotenv.config({ path: '.env'});
import minimist from 'minimist';
import { WordPress } from './WordPress.mjs'; // Import the WordPress class from the WordPress.js file
import {TroopTrack} from './TroopTrack.mjs';
import {getThirdTuesdayDate} from "./support_functions/getThirdTuesdayDate.mjs";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ===== CREATE TROOPTRACK OBJECT =====
const tt = new TroopTrack();
await tt.getData(false);

// ===== CREATE WORDPRESS OBJECT =====
const wpCofig = {
    url: process.env.WP_URL,
    username: process.env.WP_UserID,
    password: process.env.WP_KEY
};
const wp = new WordPress(wpCofig);

// ===== FIND NEXT PLC DATE =====
var curDate = new Date();                       // Get Today's Date
curDate.setHours(0, 0, 0, 0);                   // Set Time to midnight
var plcDate = getThirdTuesdayDate(curDate);     // Get Next PLC date

// Check if current Month's PLC date has passsed
if(plcDate < curDate){
    //If so, adjust date to next month and recalculate PLC date
    var newDate = new Date(curDate.getUTCFullYear(),curDate.getMonth()+1,1);
    plcDate = getThirdTuesdayDate(newDate);
}

// ===== GET TROOPTRACK CALENDAR DATA =====
// Pull Calendar information from 2 months prior to PLC date and 3 months after
var startDate = new Date(plcDate.getUTCFullYear(),plcDate.getMonth()-2,1);
var endDate = new Date(plcDate.getUTCFullYear(),plcDate.getMonth()+4,1);
var ttCal = await tt.getCalendar(startDate.toISOString().slice(0, 10),endDate.toISOString().slice(0, 10));

// ===== GET PRIOR EVENT LIST =====
var working = ttCal.events.filter(item => { 
    return ((item.event_type==='PLC') && (Date.parse(item.activity_at) < plcDate)); 
});
var lastPLC = Date.parse(working[working.length-1].activity_at);
var priorEventsList = ttCal.events.filter(item => { 
    return ((Date.parse(item.activity_at) > lastPLC) && (Date.parse(item.activity_at) < plcDate)); 
});
var priorEvents = "";
for(let i=0;i<priorEventsList.length;i++){
    var myDt = new Date(priorEventsList[i].activity_at);
    var myTitle = priorEventsList[i].title;
    var displayTitle = myTitle.replace("Troop Meeting - ","").trim();
    priorEvents = priorEvents + "<li><b>" + months[myDt.getMonth()] + " " + myDt.getDate() + "</b>: " + displayTitle + "</li>"
};

// ===== GET UPCOMING EVENT LIST  =====
var endDate = new Date(plcDate.getUTCFullYear(),plcDate.getMonth()+3,0);
var futureEvents = "<style>table, th, td {border: 1px solid black;border-collapse: collapse;}</style><table width=100%><tr style='color:white;background:#ce1126;'><th width=15%>Date(s)</th><th width=15%>Event</th><th width=35%>Meeting Program</th><th width=35%>Coordinator</th></tr>";
var futureEventsList = ttCal.events.filter(item => { 
    return ((Date.parse(item.activity_at) > plcDate) && (Date.parse(item.activity_at) <= endDate)); 
});

for(let i=0;i<futureEventsList.length;i++){
    var myDt = new Date(futureEventsList[i].activity_at);
    var myTitle = futureEventsList[i].title;
    var displayTitle = myTitle.replace("Troop Meeting - ","").trim();
    futureEvents = futureEvents + "<tr><td align=center>" + months[myDt.getMonth()] + " " + myDt.getDate() + "</td>"
        + "<td align=center>" + futureEventsList[i].event_type + "</td>"
        + "<td>" + displayTitle + "</td>"
        + "<td></td></tr>";
};
futureEvents = futureEvents + "</table>";

// ===== GET PATROL LEADER LIST =====
var patrols = tt.getPatrolList();
var PL ='';
for(let i = 0; i < patrols.length;i++){
    PL = PL + "<li>" + patrols[i] + " (PL: " + tt.getPatrolPosition(patrols[i],"Patrol Leader") + ", APL: " + tt.getPatrolPosition(patrols[i],"Assistant Patrol Leader") + ")</li>";
}

// ===== GET OTHER POSITION LIST =====
var troopPositions = "";
var troopPositionsList = tt.getTroopPositions();
for(let i = 0; i < troopPositionsList.length;i++){
    troopPositions = troopPositions + "<li>" + troopPositionsList[i] + "</li>";
}

// ===== GET OTHER BUSINESS =====

// ===== CREATE PLC POST =====
var myTitle = plcDate.toISOString().split('T')[0] + " (PLC)";
var post = {
    "title": myTitle,
    "mtg-type": [258],
    "acf": {
        "past_events": priorEvents,
        "patrol_leaders_report": PL,
        "por_report": troopPositions,
        "upcoming-events": futureEvents,
        "other_business": "",
        "reminders_and_fyis": "",
        "reference_information": ""
    },
    "status": "publish"
};
// Call the createPost method from the WordPress instance and log the result
console.log(await wp.createPost(post));

// ===== CREATE PARENTS MEETING POST =====
//"mtg-type": [259]