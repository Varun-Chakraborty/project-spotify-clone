const SELECTORS = {
    LIBRARY: 'nav .your-library .content',
    PLAYPAUSE: '.play-pause',
    PLAY: '.fa-circle-play',
    PAUSE: '.fa-circle-pause',
    SEEK: '.seek',
    VOLUME: '.volume',
    TIMEDIV: '.time',
    CURRENTIME: '.current-time',
    DURATION: '.duration',
    BACKWARD: '.fa-backward',
    FORWARD: '.fa-forward',
    MORE: '.hamburger',
    MENU: 'nav',
    MENUCLOSE: 'img.close',
    CARDS: '.cards'
};

let menu = document.querySelector(SELECTORS.MENU);
let menuClose = document.querySelector(SELECTORS.MENUCLOSE);
let hamburger = document.querySelector(SELECTORS.MORE)
let library = document.querySelector(SELECTORS.LIBRARY);
let playPause = document.querySelector(SELECTORS.PLAYPAUSE);
let play = playPause.querySelector(SELECTORS.PLAY);
let pause = playPause.querySelector(SELECTORS.PAUSE);
let seekbar = document.querySelector(SELECTORS.SEEK);
let volumebar = document.querySelector(SELECTORS.VOLUME);
let currentTime = document.querySelector(SELECTORS.TIMEDIV).querySelector(SELECTORS.CURRENTIME);
let duration = document.querySelector(SELECTORS.TIMEDIV).querySelector(SELECTORS.DURATION);
let backward = document.querySelector(SELECTORS.BACKWARD);
let forward = document.querySelector(SELECTORS.FORWARD);
let playlist = document.querySelector(SELECTORS.CARDS);
let currentSong;
let currentSongNumber;
let folders;
let songs;
let volume;

function initialise() {
    seekbar.value = 0;
    volumebar.value = 5;
    currentSong = new Audio();
    currentSongNumber = 0;
}

async function fetchSongs(folder) {
    let response = await (await fetch(folder)).text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let links = div.querySelectorAll('.view-tiles li a[href]');
    return Array.from(links).slice(1,-1).map(link => [link.getAttribute('title').slice(25, -4)].concat([link.getAttribute('href')]));
}

async function fetchFolders() {
    let response1 = await (await fetch('http://127.0.0.1:5500/assets/songs')).text();
    let div = document.createElement('div');
    div.innerHTML = response1;
    let links = div.querySelectorAll('.view-tiles li a[href]');
    links = Array.from(links).slice(1);
    for (const link of links) {
        links[links.indexOf(link)] = [await (await fetch(link.getAttribute('href') + '/info.json')).json(),
        link.getAttribute('href')];
    }
    return links;
}

function createElementForCards(details, index) {
    let card = document.createElement('div');
    card.classList.add('card', 'card' + (index + 1));
    let imgFolder = document.createElement('div');
    imgFolder.classList.add('preview-img');
    let img = document.createElement('img');
    img.setAttribute('src', details.previewimg);
    img.setAttribute('alt', "preview");
    let playbtnDiv = document.createElement('div');
    playbtnDiv.classList.add("preview-play-button");
    playbtn = document.createElement('img');
    playbtn.setAttribute('src', 'assets/img/previewplaybutton.svg');
    playbtn.setAttribute('alt', 'play-btn');
    playbtnDiv.append(playbtn);
    imgFolder.append(img, playbtnDiv);
    let h3 = document.createElement('h3');
    h3.textContent = details.name;
    let p = document.createElement('p');
    p.textContent = details.description;
    card.append(imgFolder, h3, p);
    return card;
}

function createElementForLibrary(song, index) {
    let outerDiv = document.createElement('div');
    outerDiv.classList.add('song', 'song' + (index + 1));
    let info = document.createElement('div');
    info.classList.add('info');
    let nameDiv = document.createElement('div');
    nameDiv.textContent = song[0].toLowerCase();
    nameDiv.classList.add('name');
    info.append(nameDiv);
    let playbutton = document.createElement('div');
    playbutton.classList.add('playbtn');
    let playbtnImg = document.createElement('img');
    playbtnImg.setAttribute('src', 'assets/img/previewplaybutton.svg');
    playbtnImg.setAttribute('alt', 'playbtn');
    playbutton.append(playbtnImg);
    outerDiv.append(info, playbutton);
    return outerDiv;
}

function nextSong() {
    currentSongNumber++;
    currentSongNumber = currentSongNumber == songs.length ? 0 : currentSongNumber;
    let song = songs[currentSongNumber];
    playMusic(...song);
}

function previousSong() {
    currentSongNumber--;
    currentSongNumber = currentSongNumber >= 0 ? currentSongNumber : songs.length + currentSongNumber;
    let song = songs[currentSongNumber];
    playMusic(...song)
}

function PlayPauseBtnClicked() {
    if (currentSong.currentSrc && !currentSong.paused) {
        currentSong.pause();
        pause.style.display = '';
        play.style.display = '';
    } else {
        if (!currentSong.src) {
            currentSongNumber = 0;
            let song = songs[currentSongNumber];
            playMusic(...song);
        } else {
            playMusic();
        }
    }
}

function chooseFromLibrary(evnt) {
    if (currentSong) {
        currentSong.pause();
    }
    currentSongNumber = Array.from(library.children).indexOf(evnt.currentTarget);
    let pathtoSong = songs[currentSongNumber].slice(-1)[0];
    playMusic(evnt.currentTarget.querySelector('.name').textContent, pathtoSong);
}

function displayTimes() {
    currentSong.addEventListener('timeupdate', () => {
        let [current_time, duration_] = [currentSong.currentTime, currentSong.duration];
        if (!isNaN(duration_)) {
            seekbar.value = (current_time / duration_) * 100;
        }
        [current_time, duration_] = [convert(currentSong.currentTime), convert(currentSong.duration)];
        currentTime.textContent = current_time;
        duration.textContent = duration_;
    });
}

let convert = seconds => `${Math.floor(Math.round(seconds) / 60).toString().padStart(2, '0')}:${(Math.round(seconds) % 60).toString().padStart(2, '0')}`;

function playMusic(name, track) {
    if (track) {
        currentSong.src = track;
    }

    currentSong.volume = volumebar.value / 100;
    currentSong.play();
    pause.style.display = 'block';
    play.style.display = 'none';
    displayTimes();

    let songName = document.querySelector('.songinfo').querySelector('.songName');
    if (name) {
        songName.textContent = name;
        songName.setAttribute('title', name);
    }
}

async function main() {
    folders = await fetchFolders();
    folders.forEach((folder, index) => {
        playlist.append(createElementForCards(folder[0], index));
    });

    Array.from(playlist.children).forEach(folder => {
        folder.addEventListener('click', async evnt => {
            if (currentSong.src) {
                currentSongNumber = -1;
            }
            library.innerHTML = '';
            songs = await fetchSongs(folders[Array.from(playlist.children).indexOf(evnt.currentTarget)][1]);
            songs.forEach((song, index) => {
                library.append(createElementForLibrary(song, index));
            });
            volumebar.addEventListener('input', () => {
                currentSong.volume = volumebar.value / 100;
            });

            seekbar.addEventListener('input', () => {
                currentSong.currentTime = (seekbar.value * currentSong.duration) / 100;
            });

            currentSong.addEventListener('ended', nextSong)
            forward.addEventListener('click', nextSong);
            backward.addEventListener('click', previousSong);
            playPause.addEventListener('click', PlayPauseBtnClicked);

            Array.from(library.children).forEach(song => {
                song.addEventListener('click', chooseFromLibrary);
            });
        });
    });
    initialise();
};

hamburger.addEventListener('click', () => {
    menu.style.transform = 'scaleX(1)'
});

menuClose.addEventListener('click', () => {
    menu.style.transform = ''
});

main();