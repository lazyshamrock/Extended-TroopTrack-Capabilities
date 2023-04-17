# Extended TroopTrack Capabilities
 This respository contains tools to extend the capabilities of TroopTrack to add additional functionality.  The intention is to support processes at Troop 457 in Zelienople, PA; however any TroopTrack user may utilize these tools to support their own Troops.

## Tools in Use
The functionality within this repository uses (or will use) the following toolset:
- TroopTrack Website (TroopTrack.com)
- TroopTrack API
- JavaScript
- Puppeteer (for interacting with the TroopTrack website.  This includes scraping data when it cannot be extracted via the API.)
- Keyboard Maestro (MacOS application used to execute some functionality - This may be replaced with a Chrome extension or webpage in the future.)
- Contact Form 7 (Wordpress Plugin used to create webforms for Troop Members to submit requests)
- CR7 to Webhook (Wordpress Plugin that adds the ability to trigger a webhook when a Contact Form 7 form has been completed)
- Make.com (A low/no code tool that lets you design, build and automate tasks and workflows - Used to initial workflows when Contact Form 7 form has been sumbitted via the webhook)
- Google Documents (Used to maintain the Troop's PLC and Parent's meeting Agendas)
- Shortcuts for iOS / MacOS (Used for setting up text message chains and "Returning from Event" text messages)

## Release History
| Version | Description |
| :-----: | ----------- |
| 0       | Initial Publication of README and proposed roadmap |

## Roadmap
Below is a listing of capabilities that I expect to add using the code/tools in this repository:

### Data Aggregation
(Priority #1 - This data will be used to support all subsequent functionality.))
- **Extract extended data from TroopTrack** Use the API and scraping from the web interface using Puppeteer to extract and restructure data from TroopTrack.  Data to be aggregated includes:
    - API:
        - User Details
        - Detailed progress on rank requirements
    - Web Scraping:
        - User ID
        - Health Form dates
        - Adult Drivers License (existence, not specific data)
        - Merit Badges Counseled

### Workflows
- **Merit Badge Blue Card Approval Workflow**: Members request Scoutmaster approval for a Blue Card.  The workflow will allow the Scoutmaster to:
    - Decide whether to approve the request
    - If approved:
        - Update TroopTrack to show the Scout has started working on the Merit Badge
        - Identify the Troop Merit Badge counselor or manually enter the recommended Council counselor and their contact information
        - Generate an electronic blue card 
        - Queue a blue card to be printed before the next meeting
    - Email the Scout with approval result and additional information (including PDF of blue card) via the TroopTrack email system
- **Bulk Print Blue Cards**: Print queued blue cards in bulk before a Troop Meeting
- **Request a Scoutmaster Conference / Board of Review Workflow**
- **Request Service Project Approval**
- **Monthly Exception Reporting**: Check data for each household and send an email when the following issues / discrepancies exist:
    - Health Form expired / expiring within 30 days
    - Negative Money Account / Money Account below desired threshold (configurable)
    - Adults with accounts that are not configured to receive text messages from the Troop
    - Adults / Scouts with shared email addresses.
    - Adults without BSA ID number assigned or BSA ID number without leadership position assigned (We use this information to determine if the adult is eligible to campout overnight with Scouts after 9/1/2023)
- **Campout / Event Workflow**: 
    - Email each household who has a member attending the event/activity without a current health form on file.
    - Create text message chain for adults who will be attending the event.
- **Returning from Event Text Messages**: Generate a text message to be sent by TroopTrack when the Troop is departing an event (includes an ETA for arriving at the pre-defined arrival point.)
- **Troop Election Workflow**: Make it easy to update Troop Positions and permissions within TroopTrack:
    - Update TroopTrack to end-date Scouts who are no longer holding their current position
    - Update TroopTrack to reflect the Scouts' newly elected positions
    - Adjust the Scouts' permisions in TroopTrack as appropriate.
- **Adult Leader Permissions**: Automatically set the adult leader's TroopTrack permissions based on their current position (or lack of position)

### Patrol Leaders Council (PLC)
- **Prepare PLC Meeting Agenda**:  Extract TroopTrack Calendar information about events between the last and next PLC meetings to allow for more efficient planning & Start/Stop/Continue activities.  
- **Rank Advancement Heat Map**:  Help the PLC to identify potential meeting activities by generating a visual heatmap of incomplete advancement across all Scouts.

### BSA Reporting Tool Support
- **Reconcile TroopTrack and Internet Advancement Reporting**: We occasionally note an issue between what is loaded into TroopTrack and Internet Advancement when importing from Black Pug software.  This funcationality will identify potential discrepancies between the two systems to prevent incorrectly reporting advancement.
- **Journey To Excellence Reporting**:  Extract data from TroopTrack to help complete annual Journey to Excellence reporting.