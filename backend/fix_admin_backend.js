const fs = require('fs');
const path = 'src/routes/admin.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove totalClients from statistics and add last 7 days data
const statsTarget = `const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } });`;
const statsReplacement = `
       // Calculate Last 7 Days Revenue
       const sevenDaysAgo = new Date();
       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
       
       const recentPayments = await prisma.payment.findMany({
           where: { status: 'success', createdAt: { gte: sevenDaysAgo } },
           select: { amount: true, createdAt: true }
       });
       
       const recentUsers = await prisma.user.findMany({
           where: { role: 'MASTER', createdAt: { gte: sevenDaysAgo } },
           select: { createdAt: true }
       });
       
       const last7DaysRevenue = [0,0,0,0,0,0,0];
       const last7DaysRegs = [0,0,0,0,0,0,0];
       
       for (let i = 0; i < 7; i++) {
           const d = new Date();
           d.setDate(d.getDate() - (6 - i));
           const dateStr = d.toISOString().split('T')[0];
           
           recentPayments.forEach(p => {
               if (p.createdAt.toISOString().split('T')[0] === dateStr) {
                   last7DaysRevenue[i] += p.amount;
               }
           });
           recentUsers.forEach(u => {
               if (u.createdAt.toISOString().split('T')[0] === dateStr) {
                   last7DaysRegs[i] += 1;
               }
           });
       }
`;
content = content.replace(statsTarget, statsReplacement);

content = content.replace("totalClients,", "last7DaysRevenue, last7DaysRegs,");


// 2. Change regions to map countries
const regionsTargetBlock = `// Grouping logic
        const regionMap = new Map();

        masters.forEach(m => {
            let regionKey = 'Невідомо';
            if (m.city && m.city.trim() !== '') {
                // Capitalize first letter to normalize
                const cleanedCity = m.city.trim().charAt(0).toUpperCase() + m.city.trim().slice(1).toLowerCase();
                regionKey = cleanedCity;
            } else if (m.lat && m.lng) {
                // Cluster by ~20km approx (rounding to 1 decimal place)
                const rndLat = m.lat.toFixed(1);
                const rndLng = m.lng.toFixed(1);
                regionKey = \`Гео-зона (\${rndLat}, \${rndLng})\`;
            }

            if (!regionMap.has(regionKey)) {
                regionMap.set(regionKey, { region: regionKey, masterCount: 0, clientCount: 0 });
            }
            regionMap.get(regionKey).masterCount += 1;
        });

        clients.forEach(c => {
            if (c.masterId) {
                // Find master's region
                const master = masters.find(m => m.id === c.masterId);
                if (master) {
                    let regionKey = 'Невідомо';
                    if (master.city && master.city.trim() !== '') {
                        regionKey = master.city.trim().charAt(0).toUpperCase() + master.city.trim().slice(1).toLowerCase();
                    } else if (master.lat && master.lng) {
                        regionKey = \`Гео-зона (\${master.lat.toFixed(1)}, \${master.lng.toFixed(1)})\`;
                    }
                    if (regionMap.has(regionKey)) {
                        regionMap.get(regionKey).clientCount += 1;
                    }
                }
            }
        });`;

const regionsReplacementBlock = `// Country Classification Logic
        const regionMap = new Map();
        
        const getCountry = (lat, lng) => {
             if (lat > 44 && lat < 52.5 && lng > 22 && lng < 40.5) return 'Україна';
             if (lat > 49 && lat < 55 && lng > 14 && lng < 24) return 'Польща';
             if (lat > 47 && lat < 55 && lng > 5 && lng < 15) return 'Німеччина';
             return 'Інші (Європа)';
        };

        masters.forEach(m => {
            let regionKey = 'Не вказано';
            if (m.lat && m.lng) {
                regionKey = getCountry(m.lat, m.lng);
            } else if (m.city && m.city.trim() !== '') {
                // Fallback to city parsing (basic)
                const c = m.city.toLowerCase();
                if (c.includes('kyiv') || c.includes('київ') || c.includes('lviv') || c.includes('львів')) regionKey = 'Україна';
                else if (c.includes('warsaw') || c.includes('варшава') || c.includes('krakow') || c.includes('краків')) regionKey = 'Польща';
                else if (c.includes('berlin') || c.includes('берлін') || c.includes('munich') || c.includes('мюнхен')) regionKey = 'Німеччина';
                else regionKey = 'Інші';
            }

            if (!regionMap.has(regionKey)) {
                regionMap.set(regionKey, { region: regionKey, masterCount: 0 });
            }
            regionMap.get(regionKey).masterCount += 1;
        });`;
        
content = content.replace(regionsTargetBlock, regionsReplacementBlock);


// 3. Add masters analytics endpoint
const newEndpoint = `
// GET /api/admin/masters/:id/analytics
router.get('/masters/:id/analytics', async (req, res) => {
    try {
        const masterId = req.params.id;
        const totalClients = await prisma.user.count({ where: { role: 'CLIENT', masterId } });
        const totalAppointments = await prisma.appointment.count({ where: { masterId } });
        
        const completedAppointments = await prisma.appointment.count({ where: { masterId, status: 'COMPLETED' } });
        const cancelledAppointments = await prisma.appointment.count({ where: { masterId, status: 'CANCELLED' } });
        const pendingAppointments = await prisma.appointment.count({ where: { masterId, status: 'PENDING' } });
        const confirmedAppointments = await prisma.appointment.count({ where: { masterId, status: 'CONFIRMED' } });
        
        res.json({
            totalClients,
            totalAppointments,
            chartData: [
                { name: 'Completed', count: completedAppointments },
                { name: 'Cancelled', count: cancelledAppointments },
                { name: 'Confirmed', count: confirmedAppointments },
                { name: 'Pending', count: pendingAppointments }
            ]
        });
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

`;

content = content.replace("export default router;", newEndpoint + "export default router;");

fs.writeFileSync(path, content, 'utf8');
console.log("Updated admin routes.");
