
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Swiper from "react-native-swiper";

const { width, height } = Dimensions.get("window");

export default function IntroScreen() {
    const navigation = useNavigation();

    const handleGetStarted = async () => {
        await AsyncStorage.setItem("hasSeenIntro", "true"); // Store flag in AsyncStorage
        navigation.replace("Login"); // Navigate to Login
    };

    return (
        <View style={styles.container}>
            <Swiper loop={false} dotStyle={styles.dot} activeDotStyle={styles.activeDot}>
                {/* Slide 1 */}
                <View style={styles.slide}>
                    <Text style={styles.title}>Welcome to MUNTINLUPA DISTRICT OFFICE</Text>
                    <Text style={styles.description}>Stay updated with the latest news, projects, and announcements.</Text>
                </View>

                {/* Slide 2 */}
                <View style={styles.slide}>
                    <Text style={styles.title}>Get Involved</Text>
                    <Text style={styles.description}>Submit concerns, participate in projects, and connect with the community.</Text>
                </View>

                {/* Slide 3 */}
                <View style={styles.slide}>
                    <Text style={styles.title}>Let's Get Started</Text>
                    <Text style={styles.description}>Sign in with your phone number to continue.</Text>
                    <Button
                        mode="contained"
                        onPress={handleGetStarted}
                        style={styles.button}
                        labelStyle={styles.buttonText}
                    >
                        Get Started
                    </Button>
                </View>
            </Swiper>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#003580",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: "#606060",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    button: {
        marginTop: 20,
        backgroundColor: "#FFD700",
        paddingVertical: 10,
        width: "80%",
        borderRadius: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212529",
    },
    dot: {
        backgroundColor: "#D3D3D3",
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: "#003580",
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
