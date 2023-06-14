function updateData() {
    //IMPORT DATA
    
    
    //Add Patrols to List
    for(let i=1; i<6;i++){
        let newOption = new Option('New Patrol ' + i,'New Patrol ' + i);
        const select = document.querySelector('select'); 
        select.add(newOption,undefined);
    }

    let table = document.getElementById("DataTbl");

    //Prep Charts - Percent Complete
    // Create a row using the inserRow() method and
    // specify the index where you want to add the row
    let row = table.insertRow(-1); // We are adding at the end
 
    for(let i=0; i<4;i++) {
        let c = row.insertCell(i);
        c.innerHTML='<span class="percent">' + i + '%</span><br><span style="font-weight:lighter; font-size:smaller;">Complete</span><br>&nbsp;';
    }

    //Prep Charts - Heat Map
    row = table.insertRow(-1); // We are adding at the end
 
    for(let i=0; i<4;i++) {
        let c = row.insertCell(i);
        c.innerHTML='<p>HEAT MAP</p>';
    }

    /* table = document.getElementById("testTbl");
    
    for(let i=0; i<4;i++) {
        row1 = table.insertColumn(); // We are adding at the end
        let c1 = row1.insertCell(1);
        c1.innerHTML='<span class="percent">' + i + '%</span><br><span style="font-weight:lighter; font-size:smaller;">Complete</span><br>&nbsp;';

        row2 = table.insertColumn(); // We are adding at the end
        let c2 = row2.insertCell(2);
        c2.innerHTML='<p>HEAT MAP</p>';
    }    */
};

function changeCombo(myCombo) {
    alert(myCombo.value);
}

function RefreshMyData(){
    alert('HERE');
}