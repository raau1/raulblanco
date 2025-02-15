// Sample POI data array
const poiData = [
    { name: "Water Dispenser", type: "Water Dispensers", location: "Main Hall" },
    { name: "Microwave Station", type: "Microwave", location: "Student Center" },
    { name: "Study Space", type: "Study", location: "Sir Bobs Burgess" },
    { name: "Study Space", type: "Study", location: "Percy Gee" },
    { name: "Study Zone", type: "Study", location: "David Wilson" },
    { name: "Study Zone", type: "Study", location: "Charles Wilson" },
    { name: "Bike Space", type: "Bike Spaces", location: "Sir Bobs Burguess" },
    { name: "Bike Space", type: "Bike Spaces", location: "Percy Gee" },
    { name: "Bike Space", type: "Bike Spaces", location: "David Wilson" },
    { name: "Bike Space", type: "Bike Spaces", location: "Charles Wilson" },
    { name: "Microwave Station", type: "Microwave", location: "Sir Bobs Burgess" },
    { name: "Microwave Station", type: "Microwave", location: "Percy Gee" },
    { name: "Microwave Station", type: "Microwave", location: "David Wilson" },
    { name: "Microwave Station", type: "Microwave", location: "Charles Wilson" },
    { name: "Water Dispenser", type: "Water Dispensers", location: "Sir Bobs Burgess" },
    { name: "Water Dispenser", type: "Water Dispensers", location: "Charles Wilson" },
    { name: "Water Dispenser", type: "Water Dispensers", location: "Percy Gee" },
    { name: "Water Dispenser", type: "Water Dispensers", location: "David Wilson" },


    // Add more POIs here with appropriate 'type' values
];

// Function to display POIs based on filter
function displayPOIs(filteredPOIs) {
    const poiList = document.getElementById("poi-list");
    poiList.innerHTML = ""; // Clear previous entries

    filteredPOIs.forEach(poi => {
        const poiItem = document.createElement("div");
        poiItem.className = "poi-item list-group-item";
        // Display only name and location, without type
        poiItem.innerHTML = `<strong>${poi.name}</strong><br><small>Location: ${poi.location}</small>`;
        poiList.appendChild(poiItem);
    });
}

// Filter function
function filterPOI(type) {
    if (type === 'all') {
        displayPOIs(poiData); // Show all POIs
    } else {
        const filtered = poiData.filter(poi => poi.type === type);
        displayPOIs(filtered); // Show only selected type
    }
}

// Initial load - display all POIs
window.onload = () => displayPOIs(poiData);

// Optional: Map setup
document.getElementById("map").style.display = "block"; // Display map

// Initialize map with Leaflet.js
const map = L.map('map').setView([latitude, longitude], 15); // Adjust with actual campus coordinates
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add POI markers to the map
poiData.forEach(poi => {
    // Use sample coordinates; replace with actual POI coordinates for each item
    const latitude = 52.6369; // Example latitude (adjust as necessary)
    const longitude = -1.1398; // Example longitude (adjust as necessary)
    
    L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`<b>${poi.name}</b><br>${poi.type}<br>${poi.location}`);
});
