import axios from 'axios';

const createPlaylist = async (concerts, token, spotifyId, setPlaylistIsLoading, setSpotifyRes, setSpotifyPlaylistURL) => {
  // make artist array mapping performers
  setPlaylistIsLoading(true);

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
      if (!response.data.artists.items[0]) {
        return;
      } else {
      return response.data.artists.items[0].id
      }
    }
    
    const artistArrayIds = artistArray.map(async(artist) => {
      artist.id = await searchForId(artist.name);
      return artist;
    })

    const updatedArtistArray = await Promise.all(artistArrayIds);
  
    let filteredUpdatedArtistArray = updatedArtistArray.filter((artist) => {
      return artist.id != undefined;
    })

    getTopTrack(filteredUpdatedArtistArray)
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
      if (response.data.tracks[0]) {
        return response.data.tracks[0].uri;
      }
  }

  const artistArrayTopTrack = artistArray.map(async(artist) => {
    artist.topTrack = await searchForTopTracks(artist.id);
    return artist;
  })

  const updatedArtistArray = await Promise.all(artistArrayTopTrack)
  
  const filteredArtistArrayTopTrack = updatedArtistArray.filter((artist) => {
    return artist.topTrack != undefined;
  })
  
  createSpotifyPlaylist(filteredArtistArrayTopTrack, token, spotifyId)
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
        name: `Sonic Showcase - ${date}`,
        description: "text",
        public: true,
      }
    })
  
    populatePlaylist(updatedArtistArray, response.data.id, response.data.external_urls.spotify)
  }

  const populatePlaylist = async (updatedArtistArray, playlistId, spotifyPlaylistURL) => {

    const URL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
    
    const URIs = updatedArtistArray.map((artist) => {
      return artist.topTrack;
    })

    function formatURIs (arr) {
      const maxQueries = 100;
      if (arr.length > maxQueries) {
        const batchedURIs = [];
        for (let i = 0; i < arr.length; i += maxQueries) {
          const batch = arr.slice(i, i + maxQueries);
          batchedURIs.push(batch);
      } 
      return batchedURIs;
 
    } 
    return [arr];
  }

    function addSongs(formattedURIs) {
    formattedURIs.map(async (URIs) => {
    const response = await axios({
      method: 'post',
      url: URL,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
      uris: URIs
      },
    }).catch(error => {
      setSpotifyRes(error.response.data.status)
      
    })
   
    setPlaylistIsLoading(false);
    if (response != undefined) {
      setSpotifyRes(response.status);
    }
    setSpotifyPlaylistURL(spotifyPlaylistURL)
  })
}
  addSongs(formatURIs(URIs))
}

  createEmptyPlaylist(spotifyId, token);
}

  getArtists(concerts)
  
}

export default createPlaylist;