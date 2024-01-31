const fs = require('fs');
const path = require('path');

// Function to generate initials with duplication handling
function generateInitials(firstName, lastName, initialsCount) {
    const initials = firstName.charAt(0) + lastName.charAt(0);
    const count = initialsCount[initials] || 0;
    initialsCount[initials] = count + 1;
    return count === 0 ? initials : `${initials}${count}`;
}

// Function to process the JSON and convert it to CSV format
function processJsonToCsv(jsonPath, csvPath) {
    fs.readFile(jsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the JSON file:', err);
            return;
        }

        const jsonData = JSON.parse(data);
        const initialsCount = {};
        const csvData = [];

        jsonData.forEach(household => {
            household.household_members.forEach(member => {
                if (member.scout) {
                    const initials = generateInitials(member.first_name, member.last_name, initialsCount);
                    csvData.push(`${member.first_name},${member.last_name},${initials}`);
                }
            });
        });

        const csvContent = 'First Name,Last Name,Initials\n' + csvData.join('\n');
        fs.writeFile(csvPath, csvContent, 'utf8', (err) => {
            if (err) {
                console.error('Error writing the CSV file:', err);
            } else {
                console.log('CSV file was saved successfully:', csvPath);
            }
        });
    });
}

// Usage
const jsonFilePath = path.join(__dirname, 'data', 'AggregatedData.json');
const csvFilePath = path.join(__dirname, 'data', 'ScoutList_WithInitials.csv');
processJsonToCsv(jsonFilePath, csvFilePath);
