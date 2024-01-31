// Assuming getFormSubmissions() is defined and available

import { WordPress } from './WordPress.mjs';
const defaultOption = "Approve"; // Variable to set default option

async function createTable() {
    const wp = new WordPress(); 
    const submissions = await wp.getFormSubmissions();
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    console.log("HERE");

    // Add table headers
    const headers = ["ID", "First Name", "Last Name", "Merit Badge", "Need Counselor", "Comments", "Options"];
    const tr = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    // Add rows
    submissions.forEach(submission => {
        if (submission.Status === "Open") {
            const tr = document.createElement("tr");
            Object.values(submission).forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            // Add option buttons
            const optionTd = document.createElement("td");
            const approveButton = createOptionButton("Approve", defaultOption);
            const rejectButton = createOptionButton("Reject", defaultOption);
            const reviewButton = createOptionButton("Review", defaultOption);

            optionTd.append(approveButton, rejectButton, reviewButton);
            tr.appendChild(optionTd);

            tbody.appendChild(tr);
        }
    });
    table.appendChild(tbody);

    document.getElementById("table-container").appendChild(table);
}

function createOptionButton(text, defaultOption) {
    const button = document.createElement("button");
    button.textContent = text;
    if (text === defaultOption) {
        button.classList.add("default-option");
    }
    // Add any additional button event listeners or styles here
    return button;
}

// Wrap your table creation logic in a function
function initializeTable() {
    createTable(); // This is your function that creates the table
}

// Use window.onload to call the function when the page loads
window.onload = createTable();
