import fs from 'fs';
import csv from 'csv-parser';
import { parse } from 'json2csv';

// Utility function to format date to YYYY-MM-DD
const formatDate = (date) => {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  const year = d.getFullYear().toString().padStart(4,'0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to read CSV file and convert to JSON
const csvToJson = (filename) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
};

// Main function to process files
const processFiles = async () => {
  try {
    const scouts = await csvToJson('./data/SB/Scouts.csv');
    const dob = await csvToJson('./data/SB/DOB.csv');
    const healthRecords = await csvToJson('./data/SB/BOBCAT and HEALTH RECORDS.csv');
    const adults = await csvToJson('./data/SB/Adults.csv');

    // Join scouts with DOB and health records
    const mergedData = scouts.map(scout => {
      const dobRecord = dob.find(d => d['BSA Member #'] === scout['BSA Member ID']);
      const healthRecord = healthRecords.find(h => h['BSA Member #'] === scout['BSA Member ID']);
      const parentEmails = [scout['Parent 1 Email'], scout['Parent 2 Email'], scout['Parent 3 Email']].filter(Boolean);

      const parents = adults.filter(adult => parentEmails.includes(adult.Email));
      return {
        ...scout,
        DOB: formatDate(dobRecord ? dobRecord.DOB : ''),
        MobilePhone: dobRecord ? dobRecord['Mobile Phone'] : '',
        HealthRecordAB: formatDate(healthRecord ? healthRecord['Health Record A/B'] : ''),
        Parents: parents
      };
    });

    // Convert merged data to JSON and save to file
    fs.writeFileSync('./data/scout_book.json', JSON.stringify(mergedData, null, 2));
    console.log('File successfully created!');
  } catch (error) {
    console.error('Error processing files:', error);
  }
};

processFiles();
