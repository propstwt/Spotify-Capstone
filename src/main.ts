import "./style.css";
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";

// Client ID for the Spotify API.
const clientId = "7666b9483fa648d097ec418979d47c55";

// Scopes that the user must authorize.
const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-top-read",
  "user-library-read",
  "user-follow-read",
];

// Creates a new instance of the Spotify API.
const sdk = SpotifyApi.withUserAuthorization(
  clientId,
  "http://localhost:5173/callback",
  scopes
);

// Gets the current page ID.
let page_id = document.body.id;

// Performs different actions depending on the page.
switch (page_id) {
  // Home page, used for authorization.
  case "home":
    document.getElementById("auth")!.addEventListener("click", authorize);
    break;

  // User input page, displays the user's top artists and genres.
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

    // Displays the top artists on the page.
    for (let i = 0; i < 10; i++) {
      document.getElementById(`artist${i + 1}`)!.innerText =
        topArtists.items[i].name;
      document
        .getElementById(`checkArtist${i + 1}`)!
        .setAttribute("value", artists[i]);
    }

    document.getElementById("submitBtn")!.addEventListener("click", grabIDs);

    type followedArtist = [string, string, number];
    type genre = string[];
    let genresArray: genre[] = [];
    let followedArtists: followedArtist[] = [];
    let artistsStillRemain = true;
    type next = string;
    let lastFollowedArtist: next = "";
    let currFollowedArtists = null;

    // Grabs all of the user's followed artists, and keeps track of the genres for each artist.
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

    // Sorts the genres by frequency.
    const sortedGenres = sortGenresByFrequency(genresArray);

    // Displays the top genres on the page.
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

    break;

  // Recommendations page, runs the algorithm and displays the results.
  case "recs":
    // Checks if the user has selected at least one artist and one genre.
    const selectedArtists = JSON.parse(
      localStorage.getItem("selectedArtists")!
    );
    const selectedGenres = JSON.parse(localStorage.getItem("selectedGenres")!);

    if (!selectedArtists.length || !selectedGenres.length) {
      alert("Please select at least one artist and one genre.");
      location.href = "./userinput.html";
    }

    // name, id, genres
    type similarArtist = [string, string, string[]];
    let similarArtists: similarArtist[] = [];

    // name, albumID, artistID, popularity
    type potentialAlbum = [string, string, string, number];
    let potentialAlbums: potentialAlbum[] = [];

    // Loops through each selected artist, and grabs information necessary for the algorithm.
    for (let i = 0; i < selectedArtists.length; i++) {
      const currSimArtists = await fetchRelatedArtists(selectedArtists[i]);

      // takes all the ids from currSimArtists and puts them in an array
      const currSimArtistsIDs: string[] = currSimArtists.artists.map(
        (data) => data.id
      );

      const currSimArtistsAlbumsFollowedObject: Record<string, boolean[]> = {};

      // Grabs the albums for each artist, and pushes them to potentialAlbums. Also keeps track of whether the user follows each album.
      const albumPromises = currSimArtistsIDs.map(
        (artistID) =>
          new Promise<void>(async (resolve, reject) => {
            try {
              SpotifyApi.performUserAuthorization(
                clientId,
                "http://localhost:5173/callback",
                scopes,
                async (token) => {
                  const currSimArtistsAlbumsIDs = (
                    await fetchAlbums(token, artistID)
                  )[0].albums.map(
                    ({
                      name,
                      id,
                      popularity,
                    }: {
                      name: string;
                      id: string;
                      popularity: number;
                    }) => {
                      potentialAlbums.push([name, id, artistID, popularity]);
                      return id;
                    }
                  );
                  currSimArtistsAlbumsFollowedObject[artistID] =
                    await sdk.currentUser.albums.hasSavedAlbums(
                      currSimArtistsAlbumsIDs
                    );
                  resolve();
                }
              );
            } catch (error) {
              reject(error);
            }
          })
      );

      await Promise.all(albumPromises);

      // does an api request on currSimArtists, to get an array of true/falses based on whether the user follows the artist.
      const currSimArtistsFollowed =
        await sdk.currentUser.followsArtistsOrUsers(
          currSimArtistsIDs,
          "artist"
        );

      let currentCount = 0;

      // Loops through the similar artists for each selected artist.
      // If the user already follows the artist (use currSimArtistsFollowed), the artist is skipped.
      // Stop when 5 artists have been pushed to similarArtists.
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

    // removes duplicates from similarArtists
    const seen = new Set();
    const filteredSimilarArtists = similarArtists.filter((el) => {
      const duplicate = seen.has(el[1]);
      seen.add(el[1]);
      return !duplicate;
    });

    // for each artist in filteredSimilarArtists, checks if the artist has any of the genres in selectedGenres.
    // If so, pushes the artist to a new array sorted by the number of genres that match.
    let similarArtistsWithGenreCount = getSimilarArtistsWithGenreCount(
      filteredSimilarArtists,
      selectedGenres
    );

    // take the top 5 artists from similarArtistsWithGenreCount, and get the most popular album from each artist
    let genresToFetch = [];
    type album = [string, string, string, number];
    let albums: album[] = [];
    for (let i = 0; i < 5; i++) {
      const currArtistID = similarArtistsWithGenreCount[i][1];
      genresToFetch.push(currArtistID);
      const currArtistAlbums: album[] = potentialAlbums.filter(
        (album) => album[2] == currArtistID
      );
      currArtistAlbums.sort((a, b) => b[3] - a[3]);
      albums.push(currArtistAlbums[0]);
    }

    // takes genresToFetch, and uses the API to get the genres for each artist
    let finalGenres = await sdk.artists.get(genresToFetch);
    let outputGenres: string[][] = [];
    finalGenres.forEach((data) => {
      const { genres } = data;
      outputGenres.push(genres);
    });

    // takes the top 5 albums, and displays them on the page
    for (let i = 0; i < 5; i++) {
      const albumLink = "https://open.spotify.com/embed/album/" + albums[i][1];
      document
        .getElementById(`albumRec${i + 1}`)
        ?.setAttribute("src", albumLink);
      document.getElementById(`genres${i + 1}`)!.innerText =
        outputGenres[i].length > 0
          ? "Genres: " + outputGenres[i].join(", ")
          : "Genres: Spotify has no genres for this album.";
    }

    break;
}

/**
 * Authorizes the user and redirects to the user input page.
 */
async function authorize() {
  const profile = await sdk.currentUser.profile();
  location.href = "./userinput.html";
}

/**
 * Counts the occurrence of each genre in the given genreArrays.
 * @param genreArrays - An array of arrays containing genres.
 * @returns A Map object where the keys are genres and the values are the count of their occurrences.
 */
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

/**
 * Fetches albums for a given artist using the Spotify API.
 * @param token - The access token for authentication.
 * @param artistID - The ID of the artist.
 * @returns An array of album responses.
 */
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
}

/**
 * Fetches related artists for a given artist.
 */
async function fetchRelatedArtists(artistId: string) {
  return await sdk.artists.relatedArtists(artistId);
}

/**
 * Calculates the genre count for each artist in the filteredSimilarArtists array based on the selectedGenres.
 * The resulting array is sorted in descending order based on the genre count.
 *
 * @param filteredSimilarArtists - An array of artists to filter and calculate genre count for.
 * @param selectedGenres - An array of selected genres to filter the artists by.
 * @returns An array of artists with their respective genre count, sorted in descending order.
 */
function getSimilarArtistsWithGenreCount(
  filteredSimilarArtists: any[],
  selectedGenres: string[]
) {
  return filteredSimilarArtists
    .map((artist) => {
      const genreCount = artist[2].filter((genre: string) =>
        selectedGenres?.includes(genre)
      ).length;
      return [...artist, genreCount];
    })
    .sort((a, b) => b[3] - a[3]);
}

/**
 * Grabs the selected artist IDs and genres from the checkboxes and stores them in the local storage.
 * Redirects the user to the recommendations page.
 */
function grabIDs() {
  var selectedArtists: string[] = [];
  var checkboxes = document.querySelectorAll<HTMLInputElement>(
    'input[name="items[]"]:checked'
  );

  checkboxes.forEach(function (checkbox) {
    selectedArtists.push(checkbox.value);
  });
  localStorage.setItem("selectedArtists", JSON.stringify(selectedArtists));

  var selectedGenres: string[] = [];
  var checkboxes = document.querySelectorAll<HTMLInputElement>(
    'input[name="genres[]"]:checked'
  );

  checkboxes.forEach(function (checkbox) {
    selectedGenres.push(checkbox.value);
  });
  localStorage.setItem("selectedGenres", JSON.stringify(selectedGenres));

  location.href = "./recommendations.html";
}

/**
 * Sorts the genres in the given genreArrays by their frequency.
 *
 * @param genreArrays - An array of arrays containing genres.
 * @returns An array of [genre, count] pairs sorted by count in descending order.
 */
function sortGenresByFrequency(genreArrays: string[][]): [string, number][] {
  const genreMap = countGenres(genreArrays);

  // Convert the Map to an array of [genre, count] pairs and sort by count
  const sortedGenres = Array.from(genreMap.entries())
    .filter(([_, count]) => count > 1) // Remove genres with a count of 1
    .sort((a, b) => b[1] - a[1]);

  return sortedGenres;
}
