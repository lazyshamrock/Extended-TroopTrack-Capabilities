/* =======================================================================
    BLACKPUG.JS

    DESCRIBE
   ======================================================================= */

import RSSParser from 'rss-parser';
import clipboardy from 'clipboardy';

async function getFilteredRSSItems() {
  const rssFeeds = [
    { url: 'https://scoutcal.com/BSA527.rss', prefix: '[LHC]' },
    { url: 'https://scoutcal.com/BSA500.rss', prefix: '[MTC]' },
    { url: 'https://scoutcal.com/BSA532.rss', prefix: '[FCC]' }
  ];

  const filterKeywords = ['Merit Badge', 'Training', 'University', 'BALOO', 'IOLS'];
  const filteredItems = [];

  const parser = new RSSParser();

  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 4);

  const promises = rssFeeds.map(async (feedInfo) => {
    const feed = await parser.parseURL(feedInfo.url);

    feed.items.forEach((item) => {
      const title = item.title;

      for (const keyword of filterKeywords) {
        if (title.includes(keyword)) {
          const dateMatch = title.match(/(\w{3} \d{2}, \d{4})$/); // Match date in MMM dd, yyyy format
          const dateStr = dateMatch ? dateMatch[0] : ''; // Extract date if found
          const eventDate = dateStr ? new Date(dateStr) : null;

          if (eventDate && eventDate >= today && eventDate <= threeMonthsLater) {
            const formattedDate = eventDate
              ? eventDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
              : '';
            
            // Remove duplicate words from the title
            const titleWords = title.replace(dateStr, '').trim().split(' ');
            const uniqueTitleWords = [...new Set(titleWords)];

            // Remove " -" at the end of uniqueTitleWords
            const lastWordIndex = uniqueTitleWords.length - 1;
            if (uniqueTitleWords[lastWordIndex].endsWith('-')) {
              uniqueTitleWords[lastWordIndex] = uniqueTitleWords[lastWordIndex].slice(0, -1);
            }

            let formattedTitle = `<li><b>${formattedDate}</b> - <a href='${item.link}'>${uniqueTitleWords.join(' ')}</a> ${feedInfo.prefix}</li>`;
            
            filteredItems.push({
              title: formattedTitle,
              link: item.link,
              date: eventDate,
            });
          }
          break; // Break loop if a keyword is found in the title
        }
      }
    });
  });

  await Promise.all(promises);

  // Sort filteredItems by date in ascending order
  filteredItems.sort((a, b) => a.date - b.date);

  return filteredItems;
}

async function copyToClipboard() {
  const filteredItems = await getFilteredRSSItems();
  const itemsText = filteredItems.map((item) => `${item.title}`).join('\n');
  
  try {
    clipboardy.writeSync(itemsText);
    console.log('Filtered items copied to clipboard!');
  } catch (err) {
    console.error('Unable to copy to clipboard: ', err);
  }
}

// Call the function to retrieve, filter, format, and copy RSS items when needed
getFilteredRSSItems()
  .then((filteredItems) => {
    console.log(filteredItems);
    // You can use the filtered and formatted items as needed
  })
  .catch((error) => console.error('Error processing RSS feeds:', error));

// Call the copyToClipboard function to trigger copying to clipboard
copyToClipboard();
