import { readFile } from 'fs/promises';   // Used to read aggregatedData.json file
import { writeFile } from 'fs';           // Used to write aggregatedData.json file

async function generateCSV(start_date) {
    // Parse the JSON data
    const jsonData = JSON.parse(await readFile("./data/aggregatedData.json", "utf8"));
    
    // Filter entries where the household_member 'scout' key is true
    // Reduce the entries to a flat array of household_members where scout is true
    const scouts = jsonData.reduce((acc, entry) => {
      const scoutMembers = entry.household_members.filter(member => 
        member.scout === true &&
        !member.patrol.includes('Inactive') &&
        new Date(member.date_joined) > start_date
      );
      return acc.concat(scoutMembers);
    }, []);

    // Map the filtered household_members to CSV format
    const csvLines = scouts.map(member => {
      const name = member.first_name + ' ' + member.last_name;
      const url = 'https://troop457zelie.trooptrack.com/manage/users/' + member.user_id + '?tab=achievements';
      return '"URL","' + url + '","","","' + name + '","PNG","Fleur de lis_B&W.jpg","5","Yes","' + name + '","50"';
    });

    // Add header line
    csvLines.unshift('"Type","Content","Number","Message","Filename","FileType","IconPath","IconSizePercent","IconLockToSquares","BottomText","BottomTextSize"');

    // Join all CSV lines into a single string
    const csvContent = csvLines.join('\n');

    // Write the CSV data to a file
    writeFile('./data/qrcodes.csv', csvContent, (err) => {
      if (err) {
        console.error('Error writing the CSV file:', err);
        return;
      }
    });
}

export { generateCSV };