import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

const AdminDashboard = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
        // Implement logout functionality here
        // For example, using Firebase Auth:
        // auth().signOut();
        navigation.navigate("Login"); // Navigate back to login screen
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, Admin!</Text>
            {/* Add admin-specific functionalities here */}
            <Button title="Manage Users" onPress={() => {/* Navigate to user management screen */}} />
            <Button title="View Reports" onPress={() => {/* Navigate to reports screen */}} />
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
    },
});

export default AdminDashboard;
