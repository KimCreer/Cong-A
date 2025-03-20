import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet, Dimensions, Image } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    
    // Initialize Firebase services
    const auth = getAuth();
    const firestore = getFirestore();

    useEffect(() => {
        checkIfFirstLaunch();
    }, []);

    const checkIfFirstLaunch = async () => {
        const hasSeenIntro = await AsyncStorage.getItem("hasSeenIntro");
        if (!hasSeenIntro) {
            navigation.replace("Intro");
        }
    };

    // Function to normalize phone number to +1XXXXXXXXXX
    const formatPhoneNumber = (input) => {
        let number = input.replace(/\D/g, ""); // Remove non-numeric characters
        if (number.startsWith("0")) {
            number = number.substring(1); // Remove leading zero
        }
        return `+1${number}`; // Add country code +1
    };

    const signInWithPhoneNumberHandler = async () => {
        if (!phoneNumber.trim() || phoneNumber.length < 10) {
            Alert.alert("Error", "Please enter a valid phone number.");
            return;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);

        try {
            setLoading(true);

            // Check in "admins" collection
            const adminRef = collection(firestore, "admins");
            const adminSnapshot = await getDocs(query(adminRef, where("phone", "==", formattedPhone)));

            if (!adminSnapshot.empty) {
                Alert.alert("Welcome!", "Logging in as Admin...");
                navigation.navigate("AdminDashboard");
                return;
            }

            // Check in "users" collection
            const userRef = collection(firestore, "users");
            const userSnapshot = await getDocs(query(userRef, where("phoneNumber", "==", formattedPhone)));

            if (!userSnapshot.empty) {
                Alert.alert("Welcome!", "Logging in as User...");
                navigation.navigate("Dashboard");
                return;
            }

            // If not found, send OTP
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            setConfirm(confirmation);
        } catch (error) {
            Alert.alert("Error", "Failed to check user data. Please try again.");
            console.log("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async () => {
        if (!code.trim()) {
            Alert.alert("Error", "Please enter the OTP code.");
            return;
        }
        try {
            setLoading(true);
            const userCredential = await confirm.confirm(code);
            const user = userCredential.user;
    
            // Check user role
            const userDocRef = doc(firestore, "users", user.uid);
            const userDocument = await getDoc(userDocRef);
            
            // Use exists property correctly
            if (userDocument.exists) {
                const userData = userDocument.data();
                navigation.navigate(userData.role === "admin" ? "AdminDashboard" : "Dashboard");
            } else {
                navigation.navigate("Detail", { uid: user.uid });
            }
        } catch (error) {
            Alert.alert("Error", "Invalid verification code.");
            console.log("Invalid code:", error);
        } finally {
            setLoading(false);
        }
    };
    const skipLogin = () => {
        navigation.navigate("Dashboard");
    };

    return (
        <View style={styles.container}>
            <Image source={require("../assets/cong.png")} style={styles.logo} />
            <Text style={styles.title}>Welcome to MUNTINLUPA DISTRICT OFFICE</Text>
            <Text style={styles.description}>
                Securely sign in with your phone number. A one-time password (OTP) will be sent via SMS.
            </Text>

            <TextInput
                label={!confirm ? "Phone Number" : "Enter OTP Code"}
                mode="outlined"
                value={!confirm ? phoneNumber : code}
                onChangeText={!confirm ? setPhoneNumber : setCode}
                keyboardType={!confirm ? "phone-pad" : "number-pad"}
                autoCompleteType={!confirm ? "tel" : "sms-otp"}
                textContentType={!confirm ? "telephoneNumber" : "oneTimeCode"}
                left={
                    <TextInput.Icon
                        icon={() => <MaterialCommunityIcons name={!confirm ? "phone" : "lock"} size={24} color="#003580" />}
                    />
                }
                style={styles.input}
                outlineColor="#003580"
                activeOutlineColor="#002B5C"
            />

            <Button
                mode="contained"
                onPress={!confirm ? signInWithPhoneNumberHandler : confirmCode}
                style={[styles.button, loading && styles.buttonDisabled]}
                labelStyle={styles.buttonText}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" size="small" /> : !confirm ? "Send Code" : "Verify OTP"}
            </Button>

            {/* Skip Button */}
            <Button mode="text" onPress={skipLogin} style={styles.skipButton} labelStyle={styles.skipButtonText}>
                Skip for Now
            </Button>

            <Text style={styles.footerText}>
                Need help? <Text style={styles.link}>Contact Support</Text>
            </Text>
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
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
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
        marginBottom: 20,
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
    skipButton: {
        marginTop: 10,
    },
    skipButtonText: {
        color: "#003580",
    },
    footerText: {
        marginTop: 20,
        fontSize: 12,
        color: "#666",
    },
    link: {
        color: "#003580",
        textDecorationLine: "underline",
    },
});