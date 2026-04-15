import fs from 'fs';

let content = fs.readFileSync('src/screens/MasterDashboardScreen.tsx', 'utf8');

// Add helper to compute dates for the week
const getWeekDates = `  const currentWeek = React.useMemo(() => {
    const base = new Date();
    const day = base.getDay() || 7;
    base.setDate(base.getDate() - day + 1);
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.getDate();
    });
  }, []);
`;

content = content.replace('const [loading, setLoading] = useState(false);', getWeekDates + '\n  const [loading, setLoading] = useState(false);');

// Replace DAYS map rendering in the Settings Form to include currentWeek[ix]
const oldDaysMap = `{DAYS.map((day, ix) => (
            <TouchableOpacity 
              key={ix} 
              style={[styles.dayCircle, activeEditDay === ix + 1 && { backgroundColor: colors.primary }]}
              onPress={() => setActiveEditDay(ix + 1)}
            >
              <Text style={{ color: activeEditDay === ix + 1 ? '#fff' : colors.text }}>{day}</Text>
            </TouchableOpacity>
          ))}`;

const newDaysMap = `{DAYS.map((day, ix) => (
            <TouchableOpacity 
              key={ix} 
              style={[styles.dayCircle, { width: 45, height: 45, borderRadius: 22.5 }, activeEditDay === ix + 1 && { backgroundColor: colors.primary }]}
              onPress={() => setActiveEditDay(ix + 1)}
            >
              <Text style={{ color: activeEditDay === ix + 1 ? '#fff' : colors.text, fontSize: 12, fontWeight: 'bold' }}>{day}</Text>
              <Text style={{ color: activeEditDay === ix + 1 ? '#fff' : colors.textSecondary, fontSize: 10 }}>{currentWeek[ix]}</Text>
            </TouchableOpacity>
          ))}`;

content = content.replace(oldDaysMap, newDaysMap);

fs.writeFileSync('src/screens/MasterDashboardScreen.tsx', content);
console.log('patched');
