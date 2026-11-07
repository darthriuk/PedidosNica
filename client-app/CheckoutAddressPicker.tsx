import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface CheckoutAddressPickerProps {
  googleApiKey: string;
  onAddressSelected: (address: { description: string; latitude: number; longitude: number }) => void;
}

/**
 * Componente exclusivo de Google Places Autocomplete.
 * Siguiendo la regla de ahorro de costos: ÚNICAMENTE se utiliza esta API durante el Checkout
 * para validar la dirección final y obtener las coordenadas de entrega exactas.
 */
export const CheckoutAddressPicker: React.FC<CheckoutAddressPickerProps> = ({
  googleApiKey,
  onAddressSelected,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&types=address&key=${googleApiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setPredictions(data.predictions);
      }
    } catch (e) {
      console.error('Error al consultar Google Places:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setLoading(true);
    try {
      // Obtener coordenadas exactas mediante Place Details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${googleApiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        onAddressSelected({
          description,
          latitude: lat,
          longitude: lng,
        });
        setPredictions([]);
      }
    } catch (e) {
      console.error('Error al resolver detalles del lugar:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dirección exacta de entrega</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={query}
          onChangeText={searchPlaces}
          placeholder="Ej: Av. Corrientes 1234, CABA"
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        {loading && <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />}
      </View>

      {predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => handleSelectPlace(item.place_id, item.description)}
            >
              <Text style={styles.mainText}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.secondaryText}>{item.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 10 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: 48, color: '#f8fafc', fontSize: 14 },
  loader: { marginLeft: 8 },
  resultsList: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  mainText: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  secondaryText: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
