function scrapeRSVPHealth() {
    const results = [];
    var rows = document.querySelectorAll('#DataTables_Table_0 > tbody tr'), i;
    for(i = 0; i < rows.length; ++i) {
        var endDate = new Date('2022-06-30');
        var PartAStr = rows[i].children[5].textContent.trim();
        var PartBStr = rows[i].children[6].textContent.trim();
        var PartCStr = rows[i].children[7].textContent.trim();
        var PartA = new Date(PartAStr);
        var PartB = new Date(PartBStr);
	    var PartC = new Date(PartCStr);
        var actionReq = '';
        


        if (isNaN(PartA) || (PartA < endDate) ) {
            PartAStr = PartAStr + "&emsp;&#128721;";
        } else {
            PartAStr = PartAStr + "&emsp;&#128994;";
        }

        if (isNaN(PartB) || (PartB < endDate) ) {
            PartBStr = PartBStr + "&emsp;&#128721;";
        } else {
            PartBStr = PartBStr + "&emsp;&#128994;";
        }

        if (isNaN(PartC) || (PartC < endDate) ) {
            PartCStr = PartCStr + "&emsp;&#128721;";
        } else {
            PartCStr = PartCStr + "&emsp;&#128994;";
        }

        if (isNaN(PartA) || (PartA < endDate) || isNaN(PartB) || (PartB < endDate) || isNaN(PartC) || (PartC < endDate)) {
            actionReq = 'ACTION REQUIRED - Updated BSA Health Form Part(s) Needed';
            results.push({
                name: rows[i].children[1].textContent.trim(),
                user_id: /[^/]*$/.exec(rows[i].children[1].firstElementChild.getAttribute("href"))[0],
                PartA: PartAStr,
                PartB: PartBStr,
                PartC: PartCStr,
                actionRequired: actionReq
            });
        } else {
            actionReq = 'NO ACTION NEEDED - BSA Health Form Up-to-Date';
        }
    }
    return JSON.stringify(results);
}

scrapeRSVPHealth();