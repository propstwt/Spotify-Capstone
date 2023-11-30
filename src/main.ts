import "./style.css";
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = "7666b9483fa648d097ec418979d47c55";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
let access_token: AccessToken;
// if (!code) {
//   redirectToAuthCodeFlow(clientId);
//   throw new Error("No authorization code provided");
// }
// const token_string = await getAccessToken(clientId, code);
// let access_token =

// const albums = await fetchAlbums(access_token, artistID);
// console.log(albums);

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
  case "input":
    const topArtists = await sdk.currentUser.topItems(
      "artists",
      "short_term",
      10
    );
    type artist = string;
    let artists: artist[] = [];
    topArtists.items.forEach((data) => {
      const { id } = data;
      artists.push(id);
    });

    document.getElementById("artistOne")!.innerText = topArtists.items[0].name;
    document
      .getElementById("checkArtistOne")!
      .setAttribute("value", artists[0]);
    document.getElementById("artistTwo")!.innerText = topArtists.items[1].name;
    document
      .getElementById("checkArtistTwo")!
      .setAttribute("value", artists[1]);
    document.getElementById("artistThree")!.innerText =
      topArtists.items[2].name;
    document
      .getElementById("checkArtistThree")!
      .setAttribute("value", artists[2]);
    document.getElementById("artistFour")!.innerText = topArtists.items[3].name;
    document
      .getElementById("checkArtistFour")!
      .setAttribute("value", artists[3]);
    document.getElementById("artistFive")!.innerText = topArtists.items[4].name;
    document
      .getElementById("checkArtistFive")!
      .setAttribute("value", artists[4]);
    document.getElementById("artistSix")!.innerText = topArtists.items[5].name;
    document
      .getElementById("checkArtistSix")!
      .setAttribute("value", artists[5]);
    document.getElementById("artistSeven")!.innerText =
      topArtists.items[6].name;
    document
      .getElementById("checkArtistSeven")!
      .setAttribute("value", artists[6]);
    document.getElementById("artistEight")!.innerText =
      topArtists.items[7].name;
    document
      .getElementById("checkArtistEight")!
      .setAttribute("value", artists[7]);
    document.getElementById("artistNine")!.innerText = topArtists.items[8].name;
    document
      .getElementById("checkArtistNine")!
      .setAttribute("value", artists[8]);
    document.getElementById("artistTen")!.innerText = topArtists.items[9].name;
    document
      .getElementById("checkArtistTen")!
      .setAttribute("value", artists[9]);

    document.getElementById("submitBtn")!.addEventListener("click", grabIDs);

    const topTracks = await sdk.currentUser.topItems(
      "tracks",
      "short_term",
      10
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
        const { name, id, popularity, genres } = data;
        followedArtists.push([name, id, popularity]);
        genresArray.push(genres);
      });

      if (currFollowedArtists.artists.next == null) {
        artistsStillRemain = false;
      }
    }
    // console.log(followedArtists);
    // console.log(genresArray);

    const sortedGenres = sortGenresByFrequency(genresArray);
    // console.log(sortedGenres);

    for (let index = 0; index < 10; index++) {
      const currGenre = sortedGenres[index][0];
      const currGenreID = "genre" + (index + 1).toString();
      const currGenreCheckID = "checkGenre" + (index + 1).toString();
      document.getElementById(currGenreID)!.innerText = currGenre;
      document
        .getElementById(currGenreCheckID)!
        .setAttribute("value", currGenre);
    }
    localStorage.setItem("artists", JSON.stringify(artists));
    localStorage.setItem("genres", JSON.stringify(sortedGenres));
    // console.log(artists);

    break;

  case "recs":
    // const storedArtists = JSON.parse(localStorage.getItem("artists")!);
    const selectedArtists = JSON.parse(
      localStorage.getItem("selectedArtists")!
    );
    // const storedGenres = JSON.parse(localStorage.getItem("genres")!);
    const selectedGenres = JSON.parse(localStorage.getItem("selectedGenres")!);
    // console.log(selectedGenres);

    // type genreToCheck = string;
    // let genresToCheck: genreToCheck[] = [];

    // for (let index = 0; index < 10; index++) {
    //   genresToCheck.push(sortedGenres[index][0]);
    // }

    // console.log(genresToCheck);

    type similarArtist = [string, string, string[]];
    let similarArtists: similarArtist[] = [];
    // console.log(selectedArtists);

    // name, albumID, artistID, popularity
    type potentialAlbum = [string, string, string, number];
    let potentialAlbums: potentialAlbum[] = [];

    for (let i = 0; i < selectedArtists.length; i++) {
      const currSimArtists = await sdk.artists.relatedArtists(
        selectedArtists[i]
      );

      // take all the ids from currSimArtists and put them in an array
      const currSimArtistsIDs: string[] = currSimArtists.artists.map(
        (data) => data.id
      );

      console.log("here");
      console.log(currSimArtistsIDs);

      const currSimArtistsAlbumsFollowedObject: Record<string, boolean[]> = {};

      // Take all of the currSimArtistsIDs, and use the API to get all of the albums for each artist. Then, take all of these albums, and use the API to see if the user follows the albums.
      // Then, create an array that has the currSimArtistsIDs as it's indexes, and the value of each index is an array of true/false values that correspond to whether or not the user follows the album at that index.
      // Do this in as few API calls as possible. (You can only check one artist's albums at a time, but you can check 20 albums at a time. Make sure to still keep track of which artist each album belongs to.)
      for (const artistID of currSimArtistsIDs) {
        // const currSimArtistsAlbums = await sdk.artists.albums(
        //   artistID,
        //   "album,single",
        //   undefined,
        //   50
        // );
        const currSimArtistsAlbumsIDs: string[] = [];

        // await SpotifyApi.performUserAuthorization(
        //   clientId,
        //   "http://localhost:5173/callback",
        //   scopes,
        //   async (token) => {
        //     const albums = await fetchAlbums(token, artistID);
        //     if (artistID == "2ueoLVCXQ948OfhVvAy3Nn") {
        //       console.log(albums);
        //     }
        //     // console.log(albums[0].albums); // Replace console.log with your desired handling of the fetched albums
        //     albums[0].albums.forEach(
        //       (data: { name: any; id: any; popularity: any }) => {
        //         // push to potential album as well (make sure to get the artistID and the albumID)
        //         const { name, id, popularity } = data;
        //         // console.log(popularity);
        //         potentialAlbums.push([name, id, artistID, popularity]);
        //         // console.log(id);
        //         currSimArtistsAlbumsIDs.push(id);
        //       }
        //     );
        //   }
        // );

        await new Promise<void>(async (resolve, reject) => {
          try {
            SpotifyApi.performUserAuthorization(
              clientId,
              "http://localhost:5173/callback",
              scopes,
              async (token) => {
                const albums = await fetchAlbums(token, artistID);
                await Promise.all(
                  albums[0].albums.map(
                    async (data: { name: any; id: any; popularity: any }) => {
                      const { name, id, popularity } = data;
                      potentialAlbums.push([name, id, artistID, popularity]);
                      currSimArtistsAlbumsIDs.push(id);
                    }
                  )
                );
                resolve();
              }
            );
          } catch (error) {
            reject(error);
          }
        });

        // console.log(currSimArtistsAlbumsIDs);
        const currSimArtistsAlbumsFollowed =
          await sdk.currentUser.albums.hasSavedAlbums(currSimArtistsAlbumsIDs);
        // console.log(currSimArtistsAlbumsFollowed);

        currSimArtistsAlbumsFollowedObject[artistID] =
          currSimArtistsAlbumsFollowed;
      }
      // console.log(currSimArtistsAlbumsFollowedObject);

      // do one api request on currSimArtists, to get an array of true/falses based on whether the user follows the artist.
      const currSimArtistsFollowed =
        await sdk.currentUser.followsArtistsOrUsers(
          currSimArtistsIDs,
          "artist"
        );
      // console.log(currSimArtistsFollowed);

      let currentCount = 0;
      //Loop through the similar artists for each selected artist. If the user already follows the artist (use currSimArtistsFollowed), skip it and move on. Stop when 3 artists have been pushed to similarArtists.
      for (let j = 0; j < currSimArtists.artists.length; j++) {
        if (currentCount < 5) {
          if (
            !currSimArtistsFollowed[j] &&
            !currSimArtistsAlbumsFollowedObject[
              currSimArtists.artists[j].id
            ].includes(true)
          ) {
            const { name, id, genres } = currSimArtists.artists[j];
            similarArtists.push([name, id, genres]);
            currentCount++;
          }
        } else {
          break;
        }
      }
    }
    // console.log(similarArtists);

    // remove duplicates from similarArtists
    const seen = new Set();
    const filteredSimilarArtists = similarArtists.filter((el) => {
      const duplicate = seen.has(el[1]);
      seen.add(el[1]);
      return !duplicate;
    });
    console.log(filteredSimilarArtists);

    // for each artist in filteredSimilarArtists, check if the artist has any of the genres in selectedGenres. If so, push the artist to a new array. Have the new array be sorted by number of genres matched.
    type similarArtistWithGenreCount = [string, string, string[], number];
    let similarArtistsWithGenreCount: similarArtistWithGenreCount[] = [];
    for (let i = 0; i < filteredSimilarArtists.length; i++) {
      let genreCount = 0;
      for (let j = 0; j < filteredSimilarArtists[i][2].length; j++) {
        if (selectedGenres.includes(filteredSimilarArtists[i][2][j])) {
          genreCount++;
        }
      }
      if (genreCount > 0) {
        similarArtistsWithGenreCount.push([
          filteredSimilarArtists[i][0],
          filteredSimilarArtists[i][1],
          filteredSimilarArtists[i][2],
          genreCount,
        ]);
      }
    }
    // sort similarArtistsWithGenreCount by genreCount
    // console.log(similarArtistsWithGenreCount);
    similarArtistsWithGenreCount.sort((a, b) => b[3] - a[3]);
    // console.log(similarArtistsWithGenreCount);

    // take the top 5 artists from similarArtistsWithGenreCount, and get the most popular album from each artist ( use potentialAlbums to find the most popular album from each artist)
    let genresToFetch = [];
    type album = [string, string, string, number];
    let albums: album[] = [];
    for (let i = 0; i < 5; i++) {
      const currArtistID = similarArtistsWithGenreCount[i][1];
      genresToFetch.push(currArtistID);
      console.log(potentialAlbums);
      const currArtistAlbums: album[] = potentialAlbums.filter(
        (album) => album[2] == currArtistID
      );
      console.log(currArtistAlbums);
      currArtistAlbums.sort((a, b) => b[3] - a[3]);
      albums.push(currArtistAlbums[0]);
    }
    console.log(albums);

    // take genresToFetch, and use the API to get the genres for each artist
    let finalGenres = await sdk.artists.get(genresToFetch);
    let outputGenres: string[][] = [];
    finalGenres.forEach((data) => {
      const { genres } = data;
      outputGenres.push(genres);
    });
    console.log(outputGenres);

    // take the top 5 albums, and display them on the page
    const albumLink1 =
      "https://open.spotify.com/embed/album/" +
      albums[0][1] +
      "?utm_source=generator&theme=0";
    document.getElementById("albumRec1")?.setAttribute("src", albumLink1);
    document.getElementById("genres1")!.innerText =
      "Genres: " + outputGenres[0].join(", ");
    const albumLink2 = "https://open.spotify.com/embed/album/" + albums[1][1];
    document.getElementById("albumRec2")?.setAttribute("src", albumLink2);
    document.getElementById("genres2")!.innerText =
      "Genres: " + outputGenres[1].join(", ");
    const albumLink3 = "https://open.spotify.com/embed/album/" + albums[2][1];
    document.getElementById("albumRec3")?.setAttribute("src", albumLink3);
    document.getElementById("genres3")!.innerText =
      "Genres: " + outputGenres[2].join(", ");
    const albumLink4 = "https://open.spotify.com/embed/album/" + albums[3][1];
    document.getElementById("albumRec4")?.setAttribute("src", albumLink4);
    document.getElementById("genres4")!.innerText =
      "Genres: " + outputGenres[3].join(", ");
    const albumLink5 = "https://open.spotify.com/embed/album/" + albums[4][1];
    document.getElementById("albumRec5")?.setAttribute("src", albumLink5);
    document.getElementById("genres5")!.innerText =
      "Genres: " + outputGenres[4].join(", ");

    break;
}

async function authorize() {
  const profile = await sdk.currentUser.profile();
  location.href = "./userinput.html";
}

function grabIDs() {
  var selectedArtists: string[] = [];
  var checkboxes = document.querySelectorAll<HTMLInputElement>(
    'input[name="items[]"]:checked'
  );

  checkboxes.forEach(function (checkbox) {
    selectedArtists.push(checkbox.value);
  });
  localStorage.setItem("selectedArtists", JSON.stringify(selectedArtists));
  // console.log(localStorage.getItem("selectedArtists"));

  var selectedGenres: string[] = [];
  var checkboxes = document.querySelectorAll<HTMLInputElement>(
    'input[name="genres[]"]:checked'
  );

  checkboxes.forEach(function (checkbox) {
    selectedGenres.push(checkbox.value);
  });
  localStorage.setItem("selectedGenres", JSON.stringify(selectedGenres));
  // console.log(localStorage.getItem("selectedGenres"));

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

export async function redirectToAuthCodeFlow(clientId: string) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAccessToken(clientId: string, code: string) {
  const verifier = localStorage.getItem("verifier");
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchAlbums(token: AccessToken, artistID: string): Promise<any> {
  const tempResult = await fetch(
    "https://api.spotify.com/v1/artists/" +
      artistID +
      "/albums?include_groups=album%2Csingle&limit=50",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token.access_token}` },
    }
  );

  const tempAlbums = await tempResult.json();
  // grab the album ids from tempalbums and put them in an array
  const albumIDs: string[] = [];
  tempAlbums.items.forEach((data: any) => {
    const { id } = data;
    albumIDs.push(id);
  });

  // requests can only take 20 albums at a time, so split the array into chunks of 20
  const albumIDChunks: string[][] = [];
  let currChunk: string[] = [];
  for (let index = 0; index < albumIDs.length; index++) {
    currChunk.push(albumIDs[index]);
    if ((index + 1) % 20 == 0 && currChunk.length > 0) {
      albumIDChunks.push(currChunk);
      currChunk = [];
    }
  }
  if (currChunk.length > 0) {
    albumIDChunks.push(currChunk);
  }
  // console.log(albumIDChunks);

  // make a request for each chunk of albumIDs
  const albumResponsesPromises = albumIDChunks.map(async (chunk) => {
    const response = await fetch(
      "https://api.spotify.com/v1/albums?ids=" + chunk.join("%2C"),
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token.access_token}` },
      }
    );
    return response.json();
  });

  const albumResponses = await Promise.all(albumResponsesPromises);
  return albumResponses;

  // console.log(albumIDs.join("%2C"));
  // const result = await fetch(
  //   "https://api.spotify.com/v1/albums?ids=" + albumIDs.join("%2C"),
  //   {
  //     method: "GET",
  //     headers: { Authorization: `Bearer ${token.access_token}` },
  //   }
  // );
}
