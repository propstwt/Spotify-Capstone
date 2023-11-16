import "./style.css";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = "7666b9483fa648d097ec418979d47c55";
const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-top-read",
  "user-library-read",
  "user-follow-read",
];

const sdk = SpotifyApi.withUserAuthorization(
  clientId,
  "http://localhost:5173/callback",
  scopes
);

let page_id = document.body.id;

switch (page_id) {
  case "home":
    document.getElementById("auth")!.addEventListener("click", authorize);
    break;
  case "recs":
    const topArtists = await sdk.currentUser.topItems(
      "artists",
      "short_term",
      50
    );
    type userTopArtist = [string, string, string[]];
    let artists: userTopArtist[] = [];
    topArtists.items.forEach((data) => {
      const { name, id, genres } = data;
      artists.push([name, id, genres])
    });

    const topTracks = await sdk.currentUser.topItems(
      "tracks",
      "short_term",
      50
    );
    type track = string;
    let tracks: track[] = [];
    topTracks.items.forEach((data) => {
      const { id } = data;
      tracks.push(id);
    });

    // console.log(tracks);

    type followedArtist = [string, string, number];
    type genre = string[];
    let genresArray: genre[] = [];
    let followedArtists: followedArtist[] = [];
    let artistsStillRemain = true;
    type next = string;
    let lastFollowedArtist: next = "";
    let currFollowedArtists = null;

    while (artistsStillRemain) {
      if (lastFollowedArtist == null) {
        currFollowedArtists = await sdk.currentUser.followedArtists(
          undefined,
          50
        );
      } else {
        currFollowedArtists = await sdk.currentUser.followedArtists(
          lastFollowedArtist,
          50
        );
      }

      lastFollowedArtist =
        currFollowedArtists.artists.items[
          currFollowedArtists.artists.items.length - 1
        ].id;

      currFollowedArtists.artists.items.forEach((data) => {
        const { name, id, popularity} = data;
        followedArtists.push([name, id, popularity]);
        // genresArray.push(genres);
      });

      if (currFollowedArtists.artists.next == null) {
        artistsStillRemain = false;
      }
    }
    // console.log(followedArtists);
    // console.log(genresArray);

    for (let i = 0; i < artists.length; i++) {
      genresArray.push(artists[i][2]);
    }


    const sortedGenres = sortGenresByFrequency(genresArray);
    console.log(sortedGenres);
    // console.log(artists);

    type genreToCheck = string;
    let genresToCheck: genreToCheck[] = [];

    for (let index = 0; index < 15; index++) {
      genresToCheck.push(sortedGenres[index][0]);
    }

    console.log(genresToCheck);

    type similarArtist = [string, string, string[]];
    let similarArtists: similarArtist[] = [];
    // console.log(artists);

    for (let i = 0; i < 10; i++) {
      const currSimArtists = await sdk.artists.relatedArtists(artists[i][1]);
      let currSimArtistsIDs: string[] = []
      for (let j = 0; j < currSimArtists.artists.length; j++) {
        currSimArtistsIDs.push(currSimArtists.artists[j].id)
      }
      const isSimArtistFollowed = await sdk.currentUser.followsArtistsOrUsers(currSimArtistsIDs, "artist");
      let amountGoodArtists = 0;
      for (let j = 0; j < currSimArtistsIDs.length; j++) {
        if (amountGoodArtists == 3) {
          break;
        }
        if (!isSimArtistFollowed[j] && !similarArtists.some(row => row.includes(currSimArtists.artists[j].name))) {
          similarArtists.push([
            currSimArtists.artists[j].name,
            currSimArtists.artists[j].id,
            currSimArtists.artists[j].genres,
          ]);
          amountGoodArtists +=1;
          console.log(currSimArtists.artists[j].name); 
        }
      }
      console.log("artist complete");
    }

    console.log(similarArtists);
    
    let similarArtistsIDs: string[] = []
    for (let index = 0; index < similarArtists.length; index++) {
      similarArtistsIDs.push(similarArtists[index][1])
    }
    console.log(similarArtistsIDs);
    const isArtistFollowed = await sdk.currentUser.followsArtistsOrUsers(similarArtistsIDs, "artist");
    console.log(isArtistFollowed);

    console.log(similarArtists);

    // const similarArtists = await sdk.artists.relatedArtists(artists[0]);
    // console.log(artists[0]);
    // console.log(similarArtists);

    let filteredSimilarArtists: similarArtist[] = [];
    console.log(genresToCheck);

    for (let i = 0; i < similarArtists.length; i++) {
      const currArtistGenres = similarArtists[i][2]
      if (!isArtistFollowed[i]) {
        for (let j = 0; j < currArtistGenres.length; j++) {
          if (genresToCheck.includes(currArtistGenres[j])) {
            filteredSimilarArtists.push(similarArtists[i]);
            console.log(currArtistGenres[j]);
            console.log("added");
            break;
          }          
        }
      }  
    }
    console.log(filteredSimilarArtists);

    const recommendations = await sdk.recommendations.get({
      seed_artists: [artists[4][1], artists[7][1], artists[2][1]],
      seed_genres: [sortedGenres[1][0], sortedGenres[2][0]],
    });
    // console.log(recommendations);

    const artist1 = await sdk.artists.get(
      recommendations.tracks[0].artists[0].id
    );
    const artist1Genres = artist1.genres;

    const artist2 = await sdk.artists.get(
      recommendations.tracks[1].artists[0].id
    );
    const artist2Genres = artist2.genres;

    const artist3 = await sdk.artists.get(
      recommendations.tracks[2].artists[0].id
    );
    const artist3Genres = artist3.genres;

    const artist4 = await sdk.artists.get(
      recommendations.tracks[3].artists[0].id
    );
    const artist4Genres = artist4.genres;

    const artist5 = await sdk.artists.get(
      recommendations.tracks[4].artists[0].id
    );
    const artist5Genres = artist5.genres;

    // const albumLink1 =
    //   "https://open.spotify.com/embed/album/" +
    //   recommendations.tracks[0].album.id +
    //   "?utm_source=generator&theme=0";
    // document.getElementById("albumRec1")?.setAttribute("src", albumLink1);
    // document.getElementById("genres1")!.innerText = "Genres: " + artist1Genres;

    // const albumLink2 =
    //   "https://open.spotify.com/embed/album/" +
    //   recommendations.tracks[1].album.id +
    //   "?utm_source=generator&theme=0";
    // document.getElementById("albumRec2")?.setAttribute("src", albumLink2);
    // document.getElementById("genres2")!.innerText = "Genres: " + artist2Genres;

    // const albumLink3 =
    //   "https://open.spotify.com/embed/album/" +
    //   recommendations.tracks[2].album.id +
    //   "?utm_source=generator&theme=0";
    // document.getElementById("albumRec3")?.setAttribute("src", albumLink3);
    // document.getElementById("genres3")!.innerText = "Genres: " + artist3Genres;

    // const albumLink4 =
    //   "https://open.spotify.com/embed/album/" +
    //   recommendations.tracks[3].album.id +
    //   "?utm_source=generator&theme=0";
    // document.getElementById("albumRec4")?.setAttribute("src", albumLink4);
    // document.getElementById("genres4")!.innerText = "Genres: " + artist4Genres;

    // const albumLink5 =
    //   "https://open.spotify.com/embed/album/" +
    //   recommendations.tracks[4].album.id +
    //   "?utm_source=generator&theme=0";
    // document.getElementById("albumRec5")?.setAttribute("src", albumLink5);
    // document.getElementById("genres5")!.innerText = "Genres: " + artist5Genres;

    // type savedAlbum = [string, string];
    // let savedAlbums: savedAlbum[] = [];
    // let albumsStillRemain = true;
    // let currOffset = 0;
    // let currSavedAlbum = null;
    // while (albumsStillRemain) {
    //   currSavedAlbum = await sdk.currentUser.albums.savedAlbums(50, currOffset)

    //   currSavedAlbum.items.forEach((data) => {
    //     const {album} = data;
    //     savedAlbums.push([album.name, album.id]);
    //   })

    //   currOffset += 50;
    //   console.log(currOffset);
    //   console.log(currSavedAlbum.total);
    //   if (currSavedAlbum.total < currOffset) {
    //     albumsStillRemain = false;
    //   }
    // }

    // console.log(savedAlbums);

    break;
}

async function authorize() {
  const profile = await sdk.currentUser.profile();
  location.href = "./recommendations.html";
}

function countGenres(genreArrays: string[][]): Map<string, number> {
  const genreMap = new Map<string, number>();

  // Flatten the nested arrays and filter out empty strings and arrays
  const flatGenres = genreArrays.flat().filter((genre) => genre.trim() !== "");

  // Count the occurrence of each genre
  flatGenres.forEach((genre) => {
    const count = genreMap.get(genre) || 0;
    genreMap.set(genre, count + 1);
  });

  return genreMap;
}

function sortGenresByFrequency(genreArrays: string[][]): [string, number][] {
  const genreMap = countGenres(genreArrays);

  // Convert the Map to an array of [genre, count] pairs and sort by count
  const sortedGenres = Array.from(genreMap.entries())
    .filter(([_, count]) => count > 1) // Remove genres with a count of 1
    .sort((a, b) => b[1] - a[1]);

  return sortedGenres;
}
