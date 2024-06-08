const express = require("express");
const fs = require('fs');
const path = require('path');

const app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine", "ejs");

const obGlobal = {
    obErori: null
};

const vectFoldere = ["temp", "backup"];
for (let folder of vectFoldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdir(caleFolder, (err) => {
            if (err) {
                console.error('Folderul nu a putut fi creat. Eroare:', err);
            }
        });
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));

// Gestionarea erorii 403 pentru calea "/Resurse"
app.use('/Resurse', function (req, res, next) {
    if (req.path === '/') {
        afisareEroare(res, 403, "403 - Esti interesat de vreun produs?", "Ai greșit site-ul.", "/Resurse/Image/erori/interzis.png");
    } else {
        next();
    }
});

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, 'Resurse/json/erori.json')).toString('utf-8');
    obGlobal.obErori = JSON.parse(continut);
    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
    }
    let err_def = obGlobal.obErori.eroare_default;
    err_def.imagine = path.join(obGlobal.obErori.cale_baza, err_def.imagine);
}
initErori();

function afisareEroare(res, _identificator, _titlu, _text, _imagine) {
    let eroare = obGlobal.obErori.info_erori.find((elem) => elem.identificator == _identificator);
    if (!eroare) {
        eroare = obGlobal.obErori.eroare_default;
    }
    res.status(eroare.identificator).render('pagini/eroare', {
        titlu: _titlu || eroare.titlu,
        text: _text || eroare.text,
        imagine: _imagine || eroare.imagine
    });
}

app.get(['/', '/index', '/home'], function (req, res) {
    res.render('pagini/index');
});

app.get('/pagina', function (req, res) {
    res.sendFile(path.join(__dirname, 'pagina.html'));
});

app.get('/Program_de_lucru', function (req, res) {
    res.sendFile(path.join(__dirname, 'Program_de_lucru.html'));
});

app.get('/favicon.ico', function (req, res) {
    res.sendFile(path.join(__dirname, "Resurse/Image/favicon.ico"));
});

// Gestionarea erorii 400 pentru cereri greșite (de ex. accesarea fișierelor .ejs)
app.get('/*.ejs', function (req, res) {
    afisareEroare(res, 400, "400 - Bad Request", "Cerere gresita", "/Resurse/Image/erori/interzis.png");
});

app.get('/*', function (req, res) {
    res.render('pagini/' + req.url.slice(1), function (err, rezultatRandare) {
        if (err) {
            if (err.message.startsWith('Failed to lookup view')) {
                afisareEroare(res, 404, "404 - Nu avem!", "Nu se gaseste pe acest server.", "/Resurse/Image/erori/lupa.png");
            } else {
                afisareEroare(res, 500, "Eroare server", err.message);
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.listen(8080);
console.log("Serverul a pornit");
