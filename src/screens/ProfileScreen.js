import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Image, Alert, ScrollView, Platform, ActivityIndicator, ImageBackground
} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage"; // Import Firebase Storage
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const isIOS = Platform.OS === 'ios';


export default function ProfileScreen() {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const [isImageSelected, setIsImageSelected] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false); // Track image upload progress

    const navigation = useNavigation();

    // Animation values
    const profileScale = useSharedValue(0);
    const detailsOpacity = useSharedValue(0);

    useEffect(() => {
        profileScale.value = withTiming(1, { duration: 500 });
        detailsOpacity.value = withTiming(1, { duration: 700 });
    }, []);

    useEffect(() => {
        const authInstance = getAuth();
        const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
            if (currentUser) {
                try {
                    const userRef = firestore().collection("users").doc(currentUser.uid);
                    const userDoc = await userRef.get();

                    if (userDoc.exists) {
                        let userData = userDoc.data();
                        if (userData.phone && typeof userData.phone === "string" && userData.phone.startsWith("+1")) {
                            userData.phone = userData.phone.replace("+1", "0");
                        }
                        setUser(userData);
                        setUpdatedUser(userData);
                    } else {
                        const newUser = {
                            firstName: "",
                            email: currentUser.email || "",
                            dob: "",
                            gender: "",
                            address: "",
                            barangay: "",
                            phone: currentUser.phoneNumber || "",
                            profilePicture: "",
                            occupation: "",
                            nationality: "",
                            Name: "",
                            Phone: "",
                            Relationship: "",
                        };
                        await userRef.set(newUser);
                        setUser(newUser);
                        setUpdatedUser(newUser);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    Alert.alert("Error", "Failed to load profile. Please try again.");
                } finally {
                    setLoading(false);
                }
            } else {
                setUser(null);
                navigation.replace("Login");
            }
        });

        return unsubscribe;
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            const authInstance = getAuth();
                            if (authInstance.currentUser) {
                                await signOut(authInstance);
                                Alert.alert("Logged Out", "You have been successfully logged out.");
                            }
                        } catch (error) {
                            console.log("Error during Logout: ", error);
                            Alert.alert("Logout Error", error.message);
                        }
                    },
                    style: "destructive",
                }
            ]
        );
    };

    const handleProfilePictureUpdate = async () => {
        if (isImageSelected) {
            // Save the new profile picture to Firebase Storage
            setIsUploadingImage(true);
            try {
                const authInstance = getAuth();
                const currentUser = authInstance.currentUser;
                if (currentUser) {
                    const imageUri = updatedUser.profilePicture;
                    const filename = imageUri.substring(imageUri.lastIndexOf("/") + 1);
                    const storagePath = `profilePictures/${currentUser.uid}/${filename}`;
                    const storageRef = storage().ref(storagePath);

                    // Upload the image
                    const response = await fetch(imageUri);
                    const blob = await response.blob();
                    await storageRef.put(blob);

                    // Get the download URL
                    const downloadUrl = await storageRef.getDownloadURL();

                    // Update Firestore with the new profile picture URL
                    await firestore().collection("users").doc(currentUser.uid).update({
                        profilePicture: downloadUrl,
                    });

                    // Update local state
                    setUpdatedUser((prev) => ({ ...prev, profilePicture: downloadUrl }));
                    setUser((prev) => ({ ...prev, profilePicture: downloadUrl }));

                    Alert.alert("Success", "Profile picture updated successfully.");
                    setIsImageSelected(false);
                }
            } catch (error) {
                console.error("Error updating profile picture:", error);
                Alert.alert("Error", "Failed to update profile picture. Please try again.");
            } finally {
                setIsUploadingImage(false);
            }
        } else {
            // Open image picker
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "You need to grant gallery access to update your profile picture.");
                return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (!result.canceled) {
                setUpdatedUser((prevUser) => ({ ...prevUser, profilePicture: result.assets[0].uri }));
                setIsImageSelected(true);
            }
        }
    };

    const handleEditPress = () => {
        if (isEditing) handleSaveChanges();
        setIsEditing(!isEditing);
    };

    const handleSaveChanges = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;
        if (currentUser) {
            try {
                await firestore().collection("users").doc(currentUser.uid).update(updatedUser);
                setUser(updatedUser);
                Alert.alert("Profile Updated", "Your profile has been successfully updated.");
            } catch (error) {
                console.log("Error updating profile:", error);
                Alert.alert("Error", "Failed to update profile. Please try again.");
            }
        }
    };
    

    const getIconName = (field) => {
        switch (field) {
            case 'firstName': return 'user';
            case 'email': return 'envelope';
            case 'dob': return 'calendar';
            case 'gender': return 'venus-mars';
            case 'address': return 'home';
            case 'barangay': return 'map-marker';
            case 'phone': return 'phone';
            case 'occupation': return 'briefcase';
            case 'nationality': return 'flag';
            case 'Name': return 'user-md';
            case 'Phone': return 'phone';
            case 'Relationship': return 'handshake-o';
            default: return 'question';
        }
    };

    const animatedProfileStyle = useAnimatedStyle(() => ({
        transform: [{ scale: profileScale.value }],
    }));

    const animatedDetailsStyle = useAnimatedStyle(() => ({
        opacity: detailsOpacity.value,
    }));

    const userDetailsFields = ["firstName", "email", "dob", "gender", "address", "barangay", "phone", "occupation", "nationality"];
    const emergencyContactFields = ["Name", "Phone", "Relationship"];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#E0F7FA', '#C5CAE9']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {user ? (
                    <>
                        {/* Profile Section */}
                        <Animated.View style={[styles.profileSection, animatedProfileStyle]}>
                            <ImageBackground
                                source={require('../../assets/bg.jpg')}
                                style={styles.profileBackground}
                            >
                                <View style={styles.profileContainer}>
                                    {/* Profile Image */}
                                    <Image
                                        source={{ uri: updatedUser.profilePicture || "https://via.placeholder.com/150" }}
                                        style={styles.profileImage}
                                    />

                                    {/* User Details */}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{updatedUser.firstName || "User Name"}</Text>
                                        <Text style={styles.userPhone}>
                                            {updatedUser.phone
                                                ? updatedUser.phone.replace(/^\+1/, '')
                                                : "09062966623"}
                                        </Text>

                                        {/* Upload/Save Profile Button */}
                                        <TouchableOpacity
                                            style={styles.uploadButton}
                                            onPress={handleProfilePictureUpdate}
                                        >
                                            <Icon
                                                firstName   ={isImageSelected ? "save" : "upload"}
                                                size={17}
                                                color="white"
                                                style={styles.uploadIcon}
                                            />
                                            <Text style={styles.uploadText}>
                                                {isImageSelected ? "Save Profile Picture" : "Upload Profile Picture"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ImageBackground>
                        </Animated.View>


                                           {/* User Details Section */}
<TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
    <Animated.View style={[styles.section, animatedDetailsStyle]}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                <Icon name="user" size={22} color="#003366" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>User Details</Text>
            </View>
            <Icon 
                name={showDetails ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#003366" 
                style={styles.arrowIcon} 
            />
        </View>
        {showDetails && (  
            isEditing ? (
                userDetailsFields.map((field) => (
                    <View key={field} style={styles.inputContainer}>
                        <Icon
                            name={getIconName(field)}
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
                        <TextInput
                            style={styles.input}
                            value={updatedUser[field]}
                            onChangeText={(text) => setUpdatedUser({ ...updatedUser, [field]: text })}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            keyboardType={field === "phone" ? "phone-pad" : "default"}
                            editable={field !== "phone"}
                        />
                    </View>
                ))
            ) : (
                userDetailsFields.map((field) => (
                    <View key={field} style={styles.detailsContainer}>
                        <Icon
                            name={getIconName(field)}
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
                        <Text style={styles.details}>
                            <Text style={styles.label}>
                                {field.charAt(0).toUpperCase() + field.slice(1)}:
                            </Text>
                            {user[field]}
                        </Text>
                    </View>
                ))
            )
        )}
    </Animated.View>
</TouchableOpacity>

{/* Emergency Contact Section */}
<TouchableOpacity onPress={() => setShowEmergency(!showEmergency)}>
    <Animated.View style={[styles.section, animatedDetailsStyle]}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                <Icon name="phone" size={22} color="#D32F2F" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Emergency Contact</Text>
            </View>
            <Icon 
                name={showEmergency ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#D32F2F" 
                style={styles.arrowIcon} 
            />
        </View>
        {showEmergency && (  
            isEditing ? (
                emergencyContactFields.map((field) => (
                    <View key={field} style={styles.inputContainer}>
                        <Icon
                            name={getIconName(field)}
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
                        <TextInput
                            style={styles.input}
                            value={updatedUser[field]}
                            onChangeText={(text) => setUpdatedUser({ ...updatedUser, [field]: text })}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            keyboardType={field === "Phone" ? "phone-pad" : "default"}
                        />
                    </View>
                ))
            ) : (
                emergencyContactFields.map((field) => (
                    <View key={field} style={styles.detailsContainer}>
                        <Icon
                            name={getIconName(field)}
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
                        <Text style={styles.details}>
                            <Text style={styles.label}>
                                {field.charAt(0).toUpperCase() + field.slice(1)}:
                            </Text>{" "}
                            {user[field] || "N/A"}
                        </Text>
                    </View>
                ))
            )
        )}
        {isEditing && showEmergency && (
            <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                    Please ensure the emergency contact details are accurate and up-to-date.
                </Text>
            </View>
        )}
    </Animated.View>
</TouchableOpacity>




                        {/* Buttons Section */}
                        <View style={styles.buttonContainer}>
                        <TouchableOpacity
    onPress={async () => {
        if (isEditing) {
            try {
                const authInstance = getAuth();
                const currentUser = authInstance.currentUser;
                if (currentUser) {
                    await firestore().collection("users").doc(currentUser.uid).update(updatedUser);
                    setUser(updatedUser); // Update local state after saving
                    Alert.alert("Profile Updated", "Your profile has been successfully updated.");
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                Alert.alert("Error", "Failed to update profile. Please try again.");
            }
        }
        setIsEditing(!isEditing);
        if (!isEditing) {
            setShowDetails(true); // Ensure User Details is visible
            setShowEmergency(true); // Ensure Emergency Contact is visible
        }
    }}
    style={styles.editButton}
>
    <Text style={styles.editText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
</TouchableOpacity>

                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>

                    </>
                ) : (
                    <Text>Loading profile...</Text>
                )}
            </ScrollView>
        </LinearGradient>
    );
}
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    gradientContainer: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
  
    header: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque
        paddingVertical: 18, 
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        borderRadius: 15, // Smoother rounded corners
        shadowColor: "#000", // Soft shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, // For Android shadow
    },
    headerTitle: {
        color: "#003366",
        fontSize: 24, // Slightly larger for emphasis
        fontWeight: "bold",
        textTransform: "uppercase", // Makes it stand out
        letterSpacing: 1, // Spacing for elegance
    },
        
        
        profileSection: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 12,
            overflow: 'hidden', // Ensures the background doesn't spill out
            marginBottom: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        profileBackground: {
            width: '110%',
            padding: 7, 
        },
        profileContainer: {
            flexDirection: 'row',  // Aligns profile image & user info horizontally
            alignItems: 'center',  // Centers content vertically
        },
        profileImage: {
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 2,
            borderColor: "#FFD700",
            backgroundColor: "#e0e0e0",
            
        },
        userInfo: {
            flex: 1,
            marginLeft: 10,
            justifyContent: "center",
            flexDirection: "column", // Ensure proper layout
            maxWidth: "80%", // Prevents text from taking full width
        },
        
        
        userName: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#FFFFFF",
            flexShrink: 1, // Prevents overflow
        },
        
        userPhone: {
            fontSize: 16,
            color: "#FFFFFF", // Changed to white
            marginBottom: 10,
        },
        
        uploadButton: {
            backgroundColor: "#003366",
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: "center",
            justifyContent: "center",
            width: "65%",
        },
        uploadIcon: {
            marginRight: 5,
        },
        uploadText: {
            color: "white",
            fontSize: 10,
            fontWeight: "bold",
        },


    
        section: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        sectionHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
        },
        sectionTitleContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        sectionIcon: {
            marginRight: 10,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "bold",
            color: '#003366',
        },
        arrowIcon: {
            marginLeft: 10,
        },
        

    
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    icon: {
        marginRight: 10,
        color: '#888',
        width: 20,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: 'transparent',
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    details: {
        fontSize: 16,
        color: '#333',
        flexShrink: 1,
        marginLeft: 5,
    },
    label: {
        fontWeight: "bold",
        marginRight: 5,
        color: '#555',
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    editButton: {
        backgroundColor: "#003366",
        padding: 12,
        borderRadius: 5,
        flex: 1,
        alignItems: "center",
        marginRight: 10,
    },
    logoutButton: {
        backgroundColor: "#dc3545",
        padding: 12,
        borderRadius: 5,
        flex: 1,
        alignItems: "center",
    },
    editText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    logoutText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    uploadIcon: {
        marginRight: 5,
    },
    noteContainer: {
        paddingVertical: 10,
        backgroundColor: '#f7f7f7',
        borderRadius: 5,
        marginTop: 10,
    },
    noteText: {
        fontSize: 14,
        color: '#666',
    },
    
});
