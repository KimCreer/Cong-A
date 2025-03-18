import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet, Dimensions, Image, TouchableOpacity } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Device from 'expo-device';

const { width, height } = Dimensions.get("window");

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [mpin, setMpin] = useState("");
    const [confirmMpin, setConfirmMpin] = useState("");
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("phone"); // "phone", "otp", "create_mpin", "confirm_mpin", "enter_mpin"
    const [isMpinSet, setIsMpinSet] = useState(false);
    const [isNewDevice, setIsNewDevice] = useState(false);
    const [forgotMpin, setForgotMpin] = useState(false);
    const [userId, setUserId] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        checkIfFirstLaunch();
    }, []);

    const checkIfFirstLaunch = async () => {
        const hasSeenIntro = await AsyncStorage.getItem("hasSeenIntro");
        if (!hasSeenIntro) {
            navigation.replace("Intro");
            return;
        }
        
        // Check if user has logged in before on this device
        const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (storedPhoneNumber) {
            setPhoneNumber(storedPhoneNumber);
            
            // Check if MPIN is set for this user
            const mpinSet = await AsyncStorage.getItem("mpinSet");
            if (mpinSet === "true") {
                setIsMpinSet(true);
                setStep("enter_mpin");
            }
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

    const handlePhoneSubmit = async () => {
        if (!phoneNumber.trim() || phoneNumber.length < 10) {
            Alert.alert("Error", "Please enter a valid phone number.");
            return;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        setLoading(true);

        try {
            // Check if this is a registered user
            const userQuery = await firestore()
                .collection("users")
                .where("phoneNumber", "==", formattedPhone)
                .get();
            
            const adminQuery = await firestore()
                .collection("admins")
                .where("phone", "==", formattedPhone)
                .get();

            if (!userQuery.empty || !adminQuery.empty) {
                // User exists
                if (!userQuery.empty) {
                    const userData = userQuery.docs[0].data();
                    setUserId(userQuery.docs[0].id);
                    
                    // Check if MPIN exists for this user
                    const mpinExists = userData.hasMpin === true;
                    
                    // Check if this is the same device
                    const deviceId = Device.deviceName + Device.modelName;
                    const storedDeviceId = await AsyncStorage.getItem("deviceId");
                    const isNewDevice = storedDeviceId !== deviceId;
                    setIsNewDevice(isNewDevice);
                    
                    // If MPIN exists and it's the same device, prompt for MPIN
                    if (mpinExists && !isNewDevice && !forgotMpin) {
                        setIsMpinSet(true);
                        setStep("enter_mpin");
                        await AsyncStorage.setItem("phoneNumber", phoneNumber);
                        await AsyncStorage.setItem("mpinSet", "true");
                    } else {
                        // Send OTP for new device or forgot MPIN
                        const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
                        setConfirm(confirmation);
                        setStep("otp");
                    }
                } else {
                    // Admin user
                    Alert.alert("Welcome!", "Logging in as Admin...");
                    navigation.navigate("AdminDashboard");
                }
            } else {
                // New user - send OTP
                const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
                setConfirm(confirmation);
                setStep("otp");
            }
        } catch (error) {
            console.log("Error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const confirmOTP = async () => {
        if (!code.trim()) {
            Alert.alert("Error", "Please enter the OTP code.");
            return;
        }
        
        try {
            setLoading(true);
            const userCredential = await confirm.confirm(code);
            const user = userCredential.user;
            setUserId(user.uid);
            
            // Save device ID
            const deviceId = Device.deviceName + Device.modelName;
            await AsyncStorage.setItem("deviceId", deviceId);
            await AsyncStorage.setItem("phoneNumber", phoneNumber);
            
            // Check if user exists in firestore
            const userDoc = await firestore().collection("users").doc(user.uid).get();
            
            if (userDoc.exists) {
                // Existing user
                const userData = userDoc.data();
                
                if (forgotMpin || isNewDevice) {
                    // Proceed to create new MPIN
                    setStep("create_mpin");
                } else if (userData.hasMpin) {
                    // User already has MPIN, but verified with OTP
                    setIsMpinSet(true);
                    setStep("enter_mpin");
                    await AsyncStorage.setItem("mpinSet", "true");
                } else {
                    // User doesn't have MPIN yet
                    setStep("create_mpin");
                }
            } else {
                // New user - go to profile setup
                navigation.navigate("Detail", { uid: user.uid });
            }
        } catch (error) {
            Alert.alert("Error", "Invalid verification code. Please try again.");
            console.log("Invalid code:", error);
        } finally {
            setLoading(false);
        }
    };

    const createMpin = () => {
        if (mpin.length !== 4 && mpin.length !== 6) {
            Alert.alert("Error", "MPIN must be 4 or 6 digits.");
            return;
        }
        
        setStep("confirm_mpin");
    };

    const confirmMpinAndSave = async () => {
        if (mpin !== confirmMpin) {
            Alert.alert("Error", "MPINs do not match. Please try again.");
            setMpin("");
            setConfirmMpin("");
            setStep("create_mpin");
            return;
        }
        
        try {
            setLoading(true);
            
            // Hash the MPIN (in a real app, use a secure hashing method)
            // For demo, we'll save a simple hashed version
            const hashedMpin = btoa(mpin); // Base64 encoding (NOT secure for production)
            
            // Save MPIN to Firestore
            await firestore().collection("users").doc(userId).update({
                hasMpin: true,
                mpinHash: hashedMpin,
                updatedAt: firestore.FieldValue.serverTimestamp()
            });
            
            // Save MPIN status to AsyncStorage
            await AsyncStorage.setItem("mpinSet", "true");
            
            // Check user role
            const userDocument = await firestore().collection("users").doc(userId).get();
            if (userDocument.exists) {
                const userData = userDocument.data();
                navigation.navigate(userData.role === "admin" ? "AdminDashboard" : "Dashboard");
            } else {
                navigation.navigate("Dashboard");
            }
        } catch (error) {
            console.log("Error saving MPIN:", error);
            Alert.alert("Error", "Failed to save MPIN. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyMpin = async () => {
        if (mpin.length !== 4 && mpin.length !== 6) {
            Alert.alert("Error", "MPIN must be 4 or 6 digits.");
            return;
        }
        
        try {
            setLoading(true);
            
            // Get user document
            const userDoc = await firestore()
                .collection("users")
                .where("phoneNumber", "==", formatPhoneNumber(phoneNumber))
                .get();
            
            if (userDoc.empty) {
                Alert.alert("Error", "User not found.");
                return;
            }
            
            const userData = userDoc.docs[0].data();
            const storedMpinHash = userData.mpinHash;
            
            // Verify MPIN (in a real app, use a secure comparison method)
            const enteredMpinHash = btoa(mpin);
            
            if (storedMpinHash === enteredMpinHash) {
                // MPIN correct
                const uid = userDoc.docs[0].id;
                
                // Navigate based on user role
                navigation.navigate(userData.role === "admin" ? "AdminDashboard" : "Dashboard");
            } else {
                Alert.alert("Error", "Incorrect MPIN. Please try again.");
                setMpin("");
            }
        } catch (error) {
            console.log("Error verifying MPIN:", error);
            Alert.alert("Error", "Failed to verify MPIN. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotMpin = () => {
        setForgotMpin(true);
        setStep("phone");
    };

    const renderStepContent = () => {
        switch (step) {
            case "phone":
                return (
                    <>
                        <Text style={styles.title}>Welcome to MUNTINLUPA DISTRICT OFFICE</Text>
                        <Text style={styles.description}>
                            Please enter your mobile number to continue.
                        </Text>
                        <View style={styles.phoneContainer}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>+1</Text>
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                mode="outlined"
                                label="Phone Number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                autoCompleteType="tel"
                                textContentType="telephoneNumber"
                                left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="phone" size={24} color="#003580" />} />}
                                outlineColor="#003580"
                                activeOutlineColor="#002B5C"
                            />
                        </View>
                        <Button
                            mode="contained"
                            onPress={handlePhoneSubmit}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            labelStyle={styles.buttonText}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" size="small" /> : "Continue"}
                        </Button>
                    </>
                );
            
            case "otp":
                return (
                    <>
                        <Text style={styles.title}>Verify Your Phone</Text>
                        <Text style={styles.description}>
                            We've sent a verification code to {formatPhoneNumber(phoneNumber)}
                        </Text>
                        <TextInput
                            style={styles.input}
                            mode="outlined"
                            label="Enter OTP"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            textContentType="oneTimeCode"
                            left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="key" size={24} color="#003580" />} />}
                            outlineColor="#003580"
                            activeOutlineColor="#002B5C"
                        />
                        <Button
                            mode="contained"
                            onPress={confirmOTP}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            labelStyle={styles.buttonText}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" size="small" /> : "Verify OTP"}
                        </Button>
                    </>
                );
            
            case "create_mpin":
                return (
                    <>
                        <Text style={styles.title}>Create Your MPIN</Text>
                        <Text style={styles.description}>
                            Create a 4 or 6-digit MPIN to secure your account.
                        </Text>
                        <TextInput
                            style={styles.input}
                            mode="outlined"
                            label="Create MPIN"
                            value={mpin}
                            onChangeText={setMpin}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="numeric" size={24} color="#003580" />} />}
                            outlineColor="#003580"
                            activeOutlineColor="#002B5C"
                        />
                        <Text style={styles.mpinTip}>Your MPIN should be either 4 or 6 digits</Text>
                        <Button
                            mode="contained"
                            onPress={createMpin}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            labelStyle={styles.buttonText}
                            disabled={loading || mpin.length < 4}
                        >
                            {loading ? <ActivityIndicator color="white" size="small" /> : "Continue"}
                        </Button>
                    </>
                );
            
            case "confirm_mpin":
                return (
                    <>
                        <Text style={styles.title}>Confirm Your MPIN</Text>
                        <Text style={styles.description}>
                            Please re-enter your MPIN to confirm.
                        </Text>
                        <TextInput
                            style={styles.input}
                            mode="outlined"
                            label="Confirm MPIN"
                            value={confirmMpin}
                            onChangeText={setConfirmMpin}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="numeric-lock" size={24} color="#003580" />} />}
                            outlineColor="#003580"
                            activeOutlineColor="#002B5C"
                        />
                        <Button
                            mode="contained"
                            onPress={confirmMpinAndSave}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            labelStyle={styles.buttonText}
                            disabled={loading || confirmMpin.length < 4}
                        >
                            {loading ? <ActivityIndicator color="white" size="small" /> : "Confirm MPIN"}
                        </Button>
                    </>
                );
            
            case "enter_mpin":
                return (
                    <>
                        <Text style={styles.title}>Enter Your MPIN</Text>
                        <Text style={styles.description}>
                            Please enter your MPIN to continue.
                        </Text>
                        <TextInput
                            style={styles.input}
                            mode="outlined"
                            label="MPIN"
                            value={mpin}
                            onChangeText={setMpin}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="numeric-lock" size={24} color="#003580" />} />}
                            outlineColor="#003580"
                            activeOutlineColor="#002B5C"
                        />
                        <Button
                            mode="contained"
                            onPress={verifyMpin}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            labelStyle={styles.buttonText}
                            disabled={loading || mpin.length < 4}
                        >
                            {loading ? <ActivityIndicator color="white" size="small" /> : "Log In"}
                        </Button>
                        <TouchableOpacity onPress={handleForgotMpin} style={styles.forgotMpinLink}>
                            <Text style={styles.forgotMpinText}>Forgot MPIN?</Text>
                        </TouchableOpacity>
                    </>
                );
            
            default:
                return null;
        }
    };

    const skipLogin = () => {
        navigation.navigate("Dashboard");
    };

    return (
        <View style={styles.container}>
            <Image source={require("../assets/cong.png")} style={styles.logo} />
            
            {renderStepContent()}
            
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
    phoneContainer: {
        flexDirection: "row",
        width: "100%",
        marginBottom: 20,
    },
    countryCode: {
        width: 60,
        height: 56,
        backgroundColor: "#F2F2F2",
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    phoneInput: {
        flex: 1,
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
    mpinTip: {
        fontSize: 12,
        color: "#666",
        marginTop: -15,
        marginBottom: 20,
        alignSelf: "flex-start",
        marginLeft: 10,
    },
    forgotMpinLink: {
        marginTop: 10,
    },
    forgotMpinText: {
        color: "#003580",
        textDecorationLine: "underline",
        fontSize: 14,
    },
});