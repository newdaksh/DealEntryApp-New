// app/index.js
import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const WEBHOOK_URL = "https://n8n.dakshjain.me/webhook/c6a91077-4afd-46c2-a0e0-b086b77500c1"; // replace

export default function Page() {
  const [dealer, setDealer] = useState('');
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function formatDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const onSubmit = async () => {
    if (!dealer.trim() || !customer.trim() || !amount.trim() || !status.trim()) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }
    const payload = { dealer: dealer.trim(), customer: customer.trim(), amount: amount.trim(), dealDate: formatDateISO(date), status: status.trim() };
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) {
        console.error('Upstream error', res.status, text);
        Alert.alert('Error', 'Server error. See console for details.');
      } else {
        Alert.alert('Saved', 'Deal saved successfully ✅');
        setDealer(''); setCustomer(''); setAmount(''); setStatus(''); setDate(new Date());
      }
    } catch (err) {
      console.error('Network error', err);
      Alert.alert('Network Error', 'Could not reach server. Check network/URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Deal Entry</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Dealer Name</Text>
        <TextInput style={styles.input} value={dealer} onChangeText={setDealer} placeholder="e.g. Rajesh Kumar" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} value={customer} onChangeText={setCustomer} placeholder="e.g. Sunita Sharma" />
      </View>

      <View style={styles.row}>
        <View style={{flex:1, marginRight:8}}>
          <Text style={styles.label}>Amount (in Rs.)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 1250000" />
        </View>

        <View style={{flex:1}}>
          <Text style={styles.label}>Deal Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{formatDateISO(date)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
        />
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <TextInput style={styles.input} value={status} onChangeText={setStatus} placeholder="Contacted / Negotiating / Closed / Follow-up" />
      </View>

      <View style={styles.actions}>
        <Button title={loading ? 'Saving...' : 'Save Deal'} onPress={onSubmit} disabled={loading} />
        <View style={{width:12}} />
        <Button title="Clear" color="#777" onPress={() => { setDealer(''); setCustomer(''); setAmount(''); setStatus(''); setDate(new Date()); }} />
      </View>

      <Text style={styles.hint}>This app sends data to your serverless proxy which forwards to n8n.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#f6f7f9' },
  title: { fontSize: 22, marginBottom: 12, fontWeight: '600' },
  field: { marginBottom: 12 },
  label: { color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d8dbe0' },
  row: { flexDirection: 'row', marginBottom: 12 },
  actions: { flexDirection: 'row', marginTop: 6 },
  hint: { marginTop: 18, color: '#444', fontSize: 12 }
});
