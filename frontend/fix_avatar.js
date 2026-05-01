const fs = require('fs');
const path = 'src/screens/ClientCalendarScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add avatarUrl state
content = content.replace(
    "const [masterType, setMasterType] = useState<string>('');",
    "const [masterType, setMasterType] = useState<string>('');\n  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);"
);

// In loadMasterId, capture avatarUrl
content = content.replace(
    "setSocialLinks({",
    "if (masterRes.data.avatarUrl) setAvatarUrl(masterRes.data.avatarUrl);\n                setSocialLinks({"
);

// In render, display image if avatarUrl exists
const renderTarget = `<View style={[styles.avatarHolder, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={{fontSize: 16}}>💅</Text>
        </View>`;
        
const renderReplacement = `<View style={[styles.avatarHolder, { borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }]}>
            {avatarUrl ? (
                <import_Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <Text style={{fontSize: 16}}>💅</Text>
            )}
        </View>`.replace('import_Image', 'Image'); // little trick because of imports

content = content.replace(renderTarget, renderReplacement);

// Need to make sure Image is imported
if (!content.includes('Image,')) {
    content = content.replace("import { View, Text, StyleSheet,", "import { View, Text, StyleSheet, Image,");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated ClientCalendarScreen avatar logic.");
