import axios from 'axios';

const createPlaylist = async (concerts, token, spotifyId, setPlaylistStatus) => {
  // make artist array mapping performers

  const getArtists = (concerts) => {
    let artists = [];
  
    concerts.map((concert) => {
      concert.performers.map((performer) => {
        artists.push(performer.name);
      })
    })
    artists = [...new Set(artists)]

    let artistArray = artists.map((artist) => {
      return {id: null, name: artist, topTrack: null}
    })
   getArtistIds(artistArray);
  }

  const getArtistIds = async (artistArray) => {

    // api call using the artist name to return the id
    async function searchForId (name) {
      const URL = `https://api.spotify.com/v1/search?q=${name}&type=artist&limit=1&offset=0`
      let response = await axios ({
        method: 'get',
        url: URL,
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      return response.data.artists.items[0].id;
    }
    
    // artistArray.forEach(async(artist) => {
    //   artist.id = await searchForId(artist.name);
    // })
    const artistArrayIds = artistArray.map(async(artist) => {
      artist.id = await searchForId(artist.name);
      return artist;
    })

    const updatedArtistArray = await Promise.all(artistArrayIds);

    getTopTrack(updatedArtistArray)
  }

  const getTopTrack = async (artistArray) => {

    async function searchForTopTracks (id) {
    const URL = `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`
      let response = await axios({
        method: 'get',
        url: URL,
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      return response.data.tracks[0].uri;
  }

  const artistArrayTopTrack = artistArray.map(async(artist) => {
    artist.topTrack = await searchForTopTracks(artist.id);
    return artist;
  })

  const updatedArtistArray = await Promise.all(artistArrayTopTrack)
  createSpotifyPlaylist(updatedArtistArray, token, spotifyId)
}

const createSpotifyPlaylist = async (updatedArtistArray, token, spotifyId) => {

  const createEmptyPlaylist = async (spotifyID, token) => {
    const URL = `https://api.spotify.com/v1/users/${spotifyID}/playlists`
    let date = new Date;
    date = date.toDateString().split(' ');
    date[2] = date[2] + ',';
    date = date.slice(1).join(' ')
    const response = await axios({
      method: 'post',
      url: URL,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        name: `Weekly SetList - ${date}`,
        description: "text",
        public: false
      }
    })
    populatePlaylist(updatedArtistArray, response.data.id)
  }

  const populatePlaylist = async (updatedArtistArray, playlistId) => {
    const URIs = updatedArtistArray.map((artist) => {
      return artist.topTrack;
    })

    const URL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
    
    const response = await axios({
      method: 'post',
      url: URL,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
      uris: URIs
      }
    })
    setPlaylistStatus(response.status)
  }

  createEmptyPlaylist(spotifyId, token);
  }

  getArtists(concerts)
  
}

export default createPlaylist;