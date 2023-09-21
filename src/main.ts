import "./style.css";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = "7666b9483fa648d097ec418979d47c55";
const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-top-read",
  "user-library-read",
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
      10
    );
    type artist = [string, string];
    let artists: artist[] = [];
    topArtists.items.forEach((data) => {
      const { id, name } = data;
      artists.push([id, name]);
    });
    const jeffArtists = await sdk.artists.relatedArtists(artists[6][0]);
    const btmi = await sdk.artists.albums(jeffArtists.artists[1].id);
    console.log(btmi);
    const albumLink =
      "https://open.spotify.com/embed/album/" +
      btmi.items[4].id +
      "?utm_source=generator&theme=0";
    document.getElementById("albumRec")?.setAttribute("src", albumLink);
    break;
}

async function authorize() {
  const profile = await sdk.currentUser.profile();
  location.href = "./recommendations.html";
}
