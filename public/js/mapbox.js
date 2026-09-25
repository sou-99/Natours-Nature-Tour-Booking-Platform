
export const displayMap = (locations) => {
    // creates the map, passing your access token to associate it with your Mapbox account, and setting the container, initial center, and zoom level
    const map = new mapboxgl.Map({
        accessToken: 'pk.eyJ1Ijoic291bXlhMjkiLCJhIjoiY210bW9hMGtrMDlxajJ5czk5NWF4ZGZtMCJ9.HXNp9BQp__queTqM9f-TbQ',
        container: 'map', // container ID
        scrollZoom: false,
        // center: [-118.113491, 34.111745], // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 10,// starting zoom
        // interactive:false
    });
    const bounds = new mapboxgl.LngLatBounds()
    locations.forEach(loc => {
        // Create Marker
        const el = document.createElement("div")
        el.className = "marker"
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
        }).setLngLat(loc.coordinates).addTo(map);

        // Add pop up
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
            .addTo(map)
        //Extend the map bounds to include current location
        bounds.extend(loc.coordinates);
    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}