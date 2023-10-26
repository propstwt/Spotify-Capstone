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
      "long_term",
      20
    );
    type artist = [string, string];
    let artists: artist[] = [];
    topArtists.items.forEach((data) => {
      const { id, name } = data;
      artists.push([id, name]);
    });

    type followedArtist = [string, string, number, string[]];
    let followedArtists: followedArtist[] = [];
    let artistsStillRemain = true;
    type next = string
    let lastFollowedArtist: next = ""
    let currFollowedArtists = null;

    while (artistsStillRemain) {
      if (lastFollowedArtist == null) {
        currFollowedArtists = await sdk.currentUser.followedArtists(undefined, 50);
      }
      else {
        currFollowedArtists = await sdk.currentUser.followedArtists(lastFollowedArtist, 50);
      }

      lastFollowedArtist = currFollowedArtists.artists.items[currFollowedArtists.artists.items.length - 1].id;

      currFollowedArtists.artists.items.forEach((data) => {
        const {name, id, popularity, genres} = data;
        followedArtists.push([name, id, popularity, genres]);
      });


      if (currFollowedArtists.artists.next == null) {
        artistsStillRemain = false;
      }
    }
    console.log(followedArtists);


    type savedAlbum = [string, string, number];
    let savedAlbums: savedAlbum[] = [];
    let albumsStillRemain = true;
    let currOffset = 0;
    let currSavedAlbum = null;
    while (albumsStillRemain) {
      currSavedAlbum = await sdk.currentUser.albums.savedAlbums(50, currOffset)

      currSavedAlbum.items.forEach((data) => {
        const {album} = data;
        savedAlbums.push([album.name, album.id, album.popularity]);
      })
            
      currOffset += 50;
      console.log(currOffset);
      console.log(currSavedAlbum.total);
      if (currSavedAlbum.total < currOffset) {
        albumsStillRemain = false;
      }
    }
    
    console.log(savedAlbums);

    break;
}

async function authorize() {
  const profile = await sdk.currentUser.profile();
  location.href = "./recommendations.html";
}
