import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Image,
    ActivityIndicator,
    RefreshControl, // Import RefreshControl for pull-to-refresh
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import LawsScreen from "./screens/LawsScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import ConcernsScreen from "./screens/ConcernsScreen";
import UpdatesScreen from "./screens/UpdatesScreen";
import InfoScreen from "./screens/InfoScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeScreen() {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({
        firstName: "User Name",
        profileImage: "https://via.placeholder.com/50",
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUserData = async () => {
        setLoading(true);
        const currentUser = auth().currentUser;

        if (currentUser) {
            try {
                const userDoc = await firestore().collection("users").doc(currentUser.uid).get();
                if (userDoc.exists) {
                    const userInfo = userDoc.data();
                    setUserData({
                        firstName: userInfo.firstName || "User Name",
                        profileImage:
                            userInfo.profilePicture && userInfo.profilePicture.trim() !== ""
                                ? userInfo.profilePicture
                                : "https://via.placeholder.com/50",
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserData();
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {/* Debugging Log */}
                    {console.log("Profile Image URL:", userData.profileImage)}
                    
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFD700" /> // Show loading spinner
                    ) : (
                        <Image
                            source={{ uri: userData.profileImage }}
                            style={styles.profileImage}
                            onError={() =>
                                setUserData((prev) => ({
                                    ...prev,
                                    profileImage: "https://via.placeholder.com/50", // Fallback image if error
                                }))
                            }
                        />
                    )}
                    <View>
                        <Text style={styles.headerSubtitle}>Welcome Back!</Text>
                        <Text style={styles.headerTitle}>{userData.firstName}</Text>
                    </View>
                    <TouchableOpacity style={styles.helpButton}>
                        <Text style={styles.helpText}>HELP</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* MAIN CONTENT */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003580" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing} // Bind refreshing state
                            onRefresh={onRefresh} // Bind refresh function
                            colors={["#003580", "#FFD700"]} // Customize spinner colors (Android)
                            tintColor="#003580" // Customize spinner color (iOS)
                        />
                    }
                >
                    {/* SERVICE GRID */}
                    <View style={styles.serviceGrid}>
                        {[
                            { name: "Laws", icon: "balance-scale", color: "#003580", screen: "Laws" },
                            { name: "Projects", icon: "tasks", color: "#FFD700", screen: "Projects" },
                            { name: "Concerns", icon: "comments", color: "#003580", screen: "Concerns" },
                            { name: "Updates", icon: "newspaper", color: "#FFD700", screen: "Updates" },
                            { name: "Info", icon: "info-circle", color: "#003580", screen: "Info" },
                            { name: "More", icon: "ellipsis-h", color: "#606060", screen: "More" },
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.serviceCard}
                                onPress={() => navigation.navigate(item.screen)}
                            >
                                <FontAwesome5 name={item.icon} size={30} color={item.color} />
                                <Text style={styles.serviceTitle}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* SECONDARY FEATURES */}
                    <Text style={styles.sectionTitle}>Do More</Text>
                    <View style={styles.quickAccess}>
                        {[
                            { name: "Community", icon: "people-outline", screen: "Community" },
                            { name: "Reports", icon: "bar-chart", screen: "Reports" },
                            { name: "Events", icon: "calendar", screen: "Events" },
                            { name: "Feedback", icon: "chatbubble-ellipses-outline", screen: "Feedback" }
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickCard}
                                onPress={() => navigation.navigate(item.screen)}
                            >
                                <Ionicons name={item.icon} size={26} color="#003580" />
                                <Text style={styles.quickTitle}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* NEWS & UPDATES */}
                    <Text style={styles.sectionTitle}>Latest Updates</Text>
                    <TouchableOpacity style={styles.newsCard}>
                        <Image
                            source={{ uri: "https://via.placeholder.com/300x150" }}
                            style={styles.newsImage}
                        />
                        <View style={styles.newsContent}>
                            <Text style={styles.newsTitle}>New Bill Passed in Muntinlupa</Text>
                            <Text style={styles.newsDesc}>
                                Congressman Jimmy Fresnedi has recently signed a new bill...
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}



    function HomeStack() {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="HomeMain" component={HomeScreen} />
                <Stack.Screen name="Laws" component={LawsScreen} />
                <Stack.Screen name="Projects" component={ProjectsScreen} />
                <Stack.Screen name="Concerns" component={ConcernsScreen} />
                <Stack.Screen name="Updates" component={UpdatesScreen} />
                <Stack.Screen name="Info" component={InfoScreen} />
            </Stack.Navigator>
        );
    }


    export default function Dashboard() {
        return (
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: "#FFD700",
                    tabBarInactiveTintColor: "#FFFFFF",
                    tabBarShowLabel: true,
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeStack}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <FontAwesome5 name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Concerns"
                    component={ConcernsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <FontAwesome5 name="comments" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <FontAwesome5 name="user" size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        );
    }


    // Styles
    const styles = StyleSheet.create({
        safeContainer: {
            flex: 1,
            backgroundColor: "#F5F7FA",
        },

        /** HEADER **/
        header: {
            backgroundColor: "#003580",
            paddingVertical: 20,
            paddingHorizontal: 25,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            elevation: 3, // Shadow for Android
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 5,
        },
        headerTop: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        profileImage: {
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 2,
            borderColor: "#FFD700",
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#FFFFFF",
        },
        headerSubtitle: {
            fontSize: 14,
            color: "#FFD700",
        },
        helpButton: {
            backgroundColor: "#FFD700",
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 10,
            elevation: 2,
        },
        helpText: {
            fontWeight: "bold",
            color: "#003580",
            fontSize: 14,
        },

        /** MAIN CONTENT **/
        scrollContainer: {
            paddingHorizontal: 20,
            paddingVertical: 15,
        },

        /** SERVICE GRID **/
        serviceGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 20,
        },
        serviceCard: {
            width: "30%",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            paddingVertical: 18,
            marginTop:10,
            borderRadius: 15,
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
        },
        serviceTitle: {
            fontSize: 14,
            fontWeight: "bold",
            color: "#003580",
            marginTop: 8,
        },

        /** SECTION TITLE **/
        sectionTitle: {
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 15,
            color: "#333",
        },

        /** QUICK ACCESS **/
        quickAccess: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
        },
        quickCard: {
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            paddingVertical: 12,
            borderRadius: 15,
            width: "22%",
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
        },
        quickTitle: {
            fontSize: 12,
            fontWeight: "bold",
            marginTop: 6,
            color: "#003580",
        },

        /** NEWS & UPDATES **/
        newsCard: {
            backgroundColor: "#FFF",
            padding: 15,
            borderRadius: 15,
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 5,
            marginTop: 15,
        },
        newsImage: {
            width: "100%",
            height: 130,
            borderRadius: 12,
        },
        newsContent: {
            marginTop: 10,
        },
        newsTitle: {
            fontSize: 16,
            fontWeight: "bold",
            color: "#333",
        },
        newsDesc: {
            fontSize: 13,
            color: "#606060",
            marginTop: 4,
        },

        /** TAB BAR **/
        tabBar: {
            backgroundColor: "#003580",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: 60,
            elevation: 5,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
    });

