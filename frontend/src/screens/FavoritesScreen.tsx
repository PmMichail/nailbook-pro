import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

export const FavoritesScreen = () => {
  const dummyData = [
    { id: '1', url: 'https://via.placeholder.com/300x300.png', likes: 12, isFav: true },
    { id: '4', url: 'https://via.placeholder.com/300x300.png', likes: 88, isFav: true },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={{ fontSize: 16 }}>❤️</Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={{ fontSize: 16 }}>⭐</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Збережене</Text>

      <FlatList 
        data={dummyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', padding: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: '#fff' },
  row: { justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 15 },
  imageContainer: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' }
});
