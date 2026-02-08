console.log('helloword');
let currentSong = new Audio();
let songs;
let currentFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }
    // Show all the songs in the playlist 
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        // Enhanced cleaning: remove %20, split at ' - ', remove file extensions, then remove bitrate, kbps, and website parts
        let cleanSongName = song.replaceAll("%20", " ")
                                .replaceAll("128", " ")
                                .replaceAll("%5B64%5D", " ")
                                .replaceAll("%5D", " ")
                                .replaceAll("%5B", " ")
                                .replaceAll("128", " ")
            .split(' - ')[0]
            .replace(/\.(mp3|wav|flac|ogg)$/i, '')
            .replace(/\b(120|320|380)\b/g, '') 
            .replace(/\bkbps\b/gi, '') 
            .replace(/[\(\[\{].*?[\)\]\}]/g, '')  
            .replace(/\s+/g, ' ')  
            .trim();  
        songUL.innerHTML = songUL.innerHTML + `<li>
                            <div class="musicIcon">
                            <img src="img/musicicon.svg">
                            </div>
                            <div class="info">
                            <div data-original="${song}"> ${cleanSongName} </div>
                            <div> Lakshya </div>
                            </div>
                            <div class="playIcon">
                                <img src="img/playicon.svg">
                            </div> </li>`;
    }
    
    // Attach an event listener to each song name (the div containing the song name)
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        let songNameDiv = e.querySelector(".info").firstElementChild;
        songNameDiv.addEventListener("click", () => {
            playMusic(songNameDiv.getAttribute('data-original'));
        });
    });
    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `${currentFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songInfo").innerHTML = decodeURI(track);
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let url = new URL(e.href, window.location.origin);
            let pathParts = url.pathname.split('/').filter(p => p);
            let songsIndex = pathParts.indexOf('songs');
            if (songsIndex !== -1 && pathParts.length > songsIndex + 1) {
                let folder = pathParts[songsIndex + 1];

                // Get the metadata of the folder
                try {
                    let fetchResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!fetchResponse.ok) {
                        console.warn(`info.json not found for ${folder}, status: ${fetchResponse.status}`);
                        continue;
                    }
                    let jsonData = await fetchResponse.json();
                    console.log(jsonData);
                    cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                                    <div>
                                        <img src="/songs/${folder}/cover.jpg" alt="Cover">
                                        <h2>${jsonData.title}</h2>                              
                                        <p>${jsonData.description}</p>
                                        <div class="play">
                                            <img src="img/cardPlay.svg" alt="Play">
                                        </div>
                                    </div>
                                </div>`;
                } catch (error) {
                    console.error(`Error for ${folder}:`, error);
                }
            } else {
                console.warn("Could not extract folder from href:", e.href);
                continue;
            }
        }
    }
    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0])
        });
    });
}

async function main() {

    // Get the list of all songs
    await getSongs("songs/chill-beats");
    playMusic(songs[0], true);

    // Display all the albums on the page
    displayAlbums();

    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songTime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} /
        ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 99 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 99;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 99;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for closing hamburger
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        console.log("Previous clicked");
        console.log(currentSong);
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        console.log("Next clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Add event to volume 
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/100");
        currentSong.volume = parseInt(e.target.value) / 100;
    });
}


// add eventlistner for mute volume
document.querySelector(".volume>img").addEventListener("click", e => {
    console.log(e.target)
    console.log("changing", e.target.src)
    if (e.target.src.includes("volume.svg")) {
        e.target.src = e.target.src.replace("volume.svg", "mute.svg")
        currentSong.volume = 0;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    }
    else {
        e.target.src = e.target.src.replace("mute.svg", "volume.svg")
        currentSong.volume = .20;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 20;
    }
})

main();


