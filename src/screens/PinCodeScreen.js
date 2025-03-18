import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const PinCodeScreen = ({ navigation }) => {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const handleSetPin = async () => {
        // Validate PIN length
        if (pin.length < 4) {
            Alert.alert("Error", "PIN must be at least 4 digits long.");
            return;
        }

        // Validate PIN match
        if (pin !== confirmPin) {
            Alert.alert("Error", "PINs do not match.");
            return;
        }

        // Get the current user
        const currentUser = auth().currentUser;
        if (!currentUser) {
            Alert.alert("Error", "No user is logged in.");
            return;
        }

        try {
            // Save the PIN code to Firestore
            await firestore()
                .collection("users")
                .doc(currentUser.uid)
                .update({
                    pinCode: pin,
                });

            Alert.alert("Success", "PIN code set successfully.");
            navigation.navigate("Dashboard"); // Navigate back to the Dashboard
        } catch (error) {
            console.error("Error setting PIN code:", error);
            Alert.alert("Error", "Failed to set PIN code.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set Your PIN Code</Text>
            <Text style={styles.subtitle}>
                Your PIN code will be used for secure access to your account.
            </Text>

            {/* PIN Input */}
            <TextInput
                style={styles.input}
                placeholder="Enter PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={pin}
                onChangeText={setPin}
            />

            {/* Confirm PIN Input */}
            <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={confirmPin}
                onChangeText={setConfirmPin}
            />

            {/* Set PIN Button */}
            <TouchableOpacity style={styles.button} onPress={handleSetPin}>
                <Text style={styles.buttonText}>Set PIN</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#F5F7FA",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#003580",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: "#606060",
        textAlign: "center",
        marginBottom: 30,
    },
    input: {
        width: "80%",
        height: 50,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: "#FFFFFF",
        fontSize: 16,
    },
    button: {
        width: "80%",
        height: 50,
        backgroundColor: "#003580",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default PinCodeScreen;