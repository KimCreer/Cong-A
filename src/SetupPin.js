import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function SetupPin() {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    
    // Safely extract parameters with defaults
    const params = route.params || {};
    const userId = params.userId || "";
    const phoneNumber = params.phoneNumber || "";
    const role = params.role || "user";

    const savePin = async () => {
        if (!userId) {
            Alert.alert("Error", "User ID is missing. Please try logging in again.");
            navigation.goBack();
            return;
        }

        if (!pin.trim() || pin.length !== 6) {
            Alert.alert("Error", "Please enter a valid 6-digit PIN.");
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert("Error", "PINs do not match. Please try again.");
            return;
        }

        try {
            setLoading(true);
            
            // Determine collection based on role
            const collection = role === "admin" ? "admins" : "users";
            
            // Update user document with PIN
            await firestore().collection(collection).doc(userId).update({
                pin: pin,
            });

            // Save phone number for future logins
            await AsyncStorage.setItem("userPhoneNumber", phoneNumber);
            await AsyncStorage.setItem("userId", userId);

            Alert.alert(
                "Success",
                "PIN setup complete. You can now use this PIN for future logins.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate(role === "admin" ? "AdminDashboard" : "Dashboard")
                    }
                ]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to save PIN. Please try again.");
            console.log("PIN setup error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set up your PIN</Text>
            <Text style={styles.description}>
                Create a 6-digit PIN for secure access to your account.
                You'll use this PIN instead of SMS verification for future logins.
            </Text>

            <TextInput
                label="Create PIN"
                mode="outlined"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                left={
                    <TextInput.Icon
                        icon={() => <MaterialCommunityIcons name="lock" size={24} color="#003580" />}
                    />
                }
                style={styles.input}
                outlineColor="#003580"
                activeOutlineColor="#002B5C"
            />

            <TextInput
                label="Confirm PIN"
                mode="outlined"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                left={
                    <TextInput.Icon
                        icon={() => <MaterialCommunityIcons name="lock-check" size={24} color="#003580" />}
                    />
                }
                style={styles.input}
                outlineColor="#003580"
                activeOutlineColor="#002B5C"
            />

            <Button
                mode="contained"
                onPress={savePin}
                style={[styles.button, loading && styles.buttonDisabled]}
                labelStyle={styles.buttonText}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" size="small" /> : "Set PIN"}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    input: {
        width: "100%",
        marginBottom: 20,
    },
    button: {
        width: "100%",
        paddingVertical: 8,
        backgroundColor: "#003580",
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
});