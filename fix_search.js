const fs = require('fs');
const path = 'backend/src/routes/client.ts';
let content = fs.readFileSync(path, 'utf8');

// The original code uses a filter that checks distance <= 10.
// We should map it to include distance first, then filter, then return.
const originalBlock = `     let filteredMasters = masters;
     
     // Geolocation filter (Haversine formula, 20km radius)
     if (lat && lng) {
        const clientLat = parseFloat(lat);
        const clientLng = parseFloat(lng);
        
        filteredMasters = masters.filter(m => {
           if (!m.lat || !m.lng) return false;
           
           const R = 6371; // Earth radius in km
           const dLat = (m.lat - clientLat) * Math.PI / 180;
           const dLng = (m.lng - clientLng) * Math.PI / 180;
           const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(clientLat * Math.PI / 180) * Math.cos(m.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
           const distance = R * c;
           
           return distance <= 10; // Within 10km
        });
     }`;

const newBlock = `     let filteredMasters = masters.map(m => ({ ...m, distance: null }));
     
     // Geolocation filter (Haversine formula, 10km radius)
     if (lat && lng) {
        const clientLat = parseFloat(lat);
        const clientLng = parseFloat(lng);
        
        const mappedMasters = masters.map(m => {
           if (!m.lat || !m.lng) return { ...m, distance: null };
           
           const R = 6371; // Earth radius in km
           const dLat = (m.lat - clientLat) * Math.PI / 180;
           const dLng = (m.lng - clientLng) * Math.PI / 180;
           const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(clientLat * Math.PI / 180) * Math.cos(m.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
           const distance = R * c;
           
           return { ...m, distance };
        });
        
        filteredMasters = mappedMasters.filter(m => m.distance !== null && m.distance <= 10);
        // Sort by distance
        filteredMasters.sort((a, b) => a.distance - b.distance);
     }`;

content = content.replace(originalBlock, newBlock);
fs.writeFileSync(path, content, 'utf8');

// Now update SearchMastersScreen.tsx to display distance
const pathFront = 'frontend/src/screens/SearchMastersScreen.tsx';
let contentFront = fs.readFileSync(pathFront, 'utf8');

contentFront = contentFront.replace(
  "{item.address ? ` • ${item.address}` : ''}",
  "{item.address ? ` • ${item.address}` : ''}\n                           {item.distance !== undefined && item.distance !== null ? ` • ~${item.distance.toFixed(1)} км` : ''}"
);

fs.writeFileSync(pathFront, contentFront, 'utf8');
