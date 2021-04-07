
document.forms["registerForm"].addEventListener("submit", e => {
    e.preventDefault();
    const form = document.forms["registerForm"];
    if (document.getElementById("note").value != ""){
        createNote(form);
    }
});

window.onload = function() {
    GetAllNotes();
}

function createTableHeader(){
    let  tr = document.createElement("tr");
    tr.setAttribute("id","table_header");
    tr.append(createSortLinkTd("complete","views/pic/sortComplete.png"));
    tr.append(createSimpleTd(""));
    tr.append(createSortLinkTd("time","views/pic/sortTime.png"));
    for(let i = 0 ; i < 2 ; i++)
        tr.append(createSimpleTd(""));

    return tr;
}

function createLink(picturePath){
    let link = document.createElement("a");
    link.setAttribute("style", "cursor:pointer;padding:15px;");
    let linkImg = document.createElement("img");
    linkImg.setAttribute("style", "vertical-align: middle");
    linkImg.setAttribute("src", picturePath);
    link.append(linkImg);

    return link;
}

function createCompleteLinkTd(data){
    let  completeLinkTd = document.createElement("td");
    let picturePath;
    if (data.complete == true) {
        picturePath = "views/pic/checkmark30.png";
    }
    else{
        picturePath="views/pic/cross30.png";
    }
    let  completeLink = createLink(picturePath);

    completeLink.addEventListener("click", e => {
        e.preventDefault();
        editNote(data._id);
    });
    completeLinkTd.append(completeLink);

    return completeLinkTd;
}

function createFileLinkTd(file){
    let  fileLinkTd = document.createElement("td");

    let filePath = "";
    if(file != "")
        filePath = "views/pic/file.png"
    let fileLink = createLink(filePath);

    fileLink.addEventListener("click", e => {
        e.preventDefault();
        downloadFile(file);
    });
    fileLinkTd.append(fileLink);

    return fileLinkTd;
}

function createTrashLinkTd(id){
    let  trashLinkTd = document.createElement("td");
    let  trashLink = createLink("views/pic/trash.png");

    trashLink.addEventListener("click", e => {
        e.preventDefault();
        deleteNote(id);
    });
    trashLinkTd.append(trashLink);

    return trashLinkTd;
}

function createSortLinkTd(sortParam, picturePath){
    let  sortLinkTd = document.createElement("td");
    let  sortLink = createLink(picturePath);

    sortLink.addEventListener("click", e => {
        e.preventDefault();
        sortNotes(sortParam);
    });
    sortLinkTd.append(sortLink);

    return sortLinkTd;
}

function createNoteTd(data){
    let  td = document.createElement("td");
    td.append(data);
    td.setAttribute("class","note-in-table")
    return td
}

function createSimpleTd(data){
    let  td = document.createElement("td");
    td.append(data);
    return td
}

function createRowInTable(data) {

    let  tr = document.createElement("tr");
    tr.setAttribute("id", data._id);

    tr.append(createCompleteLinkTd(data));
    tr.append(createNoteTd(data.note));
    tr.append(createSimpleTd(data.time));
    tr.append(createFileLinkTd(data.file));
    tr.append(createTrashLinkTd(data._id));

    return tr;
}

function cleanTable(tbody){
    while (tbody.rows[0] ) {
        tbody.deleteRow(0);
    }
}

function outputSortedData(sortParam, notes) {
    let tbody = document.getElementById("notes_tbody");

    cleanTable(tbody);

    if (notes.length > 1)
        tbody.append(createTableHeader());


    if (sortParam == "complete") {
        for(let i = 0 ; i< notes.length;i++) {
            tbody.append(createRowInTable(notes[i]));
        }
    }
    else if (sortParam == "time") {
        for(let i = 0 ; i < notes.length ;i++) {
            if(notes[i].time == "")
                continue;
            tbody.append(createRowInTable(notes[i]));
        }
        for(let i = 0 ; i < notes.length ;i++) {
            if(notes[i].time != "")
                break;
            tbody.append(createRowInTable(notes[i]));
        }
    }
}

function errorAuth() {
    const form = document.forms["registerForm"];
    form.reset();

    let tbody = document.getElementById("notes_tbody");
    while ( tbody.rows[0] ) {
        tbody.deleteRow(0);
    }
    alert("You must be logged in!!!");
}

async function sortNotes(sortParam){
    const response = await fetch("/api/sort", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({sortParam: sortParam})
    });

    if (response.ok) {
        const notes = await response.json();
        outputSortedData(sortParam, notes);
    }else if (response.status == 401)
        errorAuth();
}

async function createNote(form) {
    const formData = new FormData(form);

    const response = await fetch('api/notes', {
        method: 'POST',
        body: formData,
    });

    if (response.ok) {
        const data = await response.json();
        form.reset();
        let tbody = document.getElementById("notes_tbody");
        if (tbody.rows.length = 1)
            GetAllNotes();
        else {
            document.querySelector("tbody").append(createRowInTable(data));
        }
    }else if (response.status == 401)
        errorAuth();
}

async function deleteNote(id) {
    const response = await fetch("/api/notes/" + id, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const data = await response.json();
        document.getElementById(data._id).remove();

        let tbody = document.getElementById("notes_tbody");
        if (tbody.rows.length == 2){
            document.getElementById("table_header").remove();
        }
    }else if (response.status == 401)
        errorAuth();
}

async function editNote(id) {
    const response = await fetch("/api/notes/" + id, {
        method: "PUT",
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        const data = await response.json();
        document.getElementById(data._id).replaceWith(createRowInTable(data));
    }else if (response.status == 401)
        errorAuth();
}

async function downloadFile(file){
    const response = await fetch("/api/uploads/" + file, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    if(response.ok) {
        response.blob().then(function (blob) {
            let link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob);
            link.download = file;
            link.click();
        });
    }else if (response.status == 401)
        errorAuth();
}

async function GetAllNotes() {

    const response = await fetch("/api/notes", {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    if (response.ok) {
        const notes = await response.json();

        let tbody = document.getElementById("notes_tbody");
        while ( tbody.rows[0] ) {
            tbody.deleteRow(0);
        }

        if (notes.length > 1)
            tbody.append(createTableHeader());

        for(let i = 0 ; i< notes.length;i++) {
            tbody.append(createRowInTable(notes[i]));
        }

    }else if (response.status == 401) {
        errorAuth();
    }
}