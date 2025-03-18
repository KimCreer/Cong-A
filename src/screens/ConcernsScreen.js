import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { Card, Menu, Divider, Provider, FAB, Chip } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';


export default function ConcernsScreen() {
  const navigation = useNavigation();
  const [concerns, setConcerns] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Request permission for camera and media library
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        }
        
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is needed to choose images.');
        }
      }
    })();
  }, []);

  // Fetch concerns from Firestore
  const fetchConcerns = async () => {
    setIsFetching(true);
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Authentication Required", "You must be logged in to view concerns.");
      setIsFetching(false);
      return;
    }

    try {
      const snapshot = await firestore()
        .collection('concerns')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const concernsList = [];
      snapshot.forEach((doc) => {
        concernsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setConcerns(concernsList);
    } catch (error) {
      console.error("Error fetching concerns: ", error);
      Alert.alert("Error", "There was an issue fetching your concerns.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
  }, []);

  // Fixed: Select image function with proper error handling
  const selectImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "You need to allow access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image: ", error);
      Alert.alert("Error", "There was an issue selecting the image.");
    }
  };

  // Take photo function
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "You need to allow access to your camera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo: ", error);
      Alert.alert("Error", "There was an issue taking the photo.");
    }
  };

  // Fixed: Upload image function with proper error handling
  const uploadImage = async (imageUri) => {
    if (!imageUri) {
      console.log("No image URI provided");
      return null;
    }
  
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Authentication Required", "You must be logged in to upload an image.");
      return null;
    }
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      console.log("Starting image upload for URI:", imageUri);
  
      // Create a unique filename
      const filename = imageUri.substring(imageUri.lastIndexOf("/") + 1);
      const uniqueFilename = `${user.uid}_${Date.now()}_${filename}`;
      const storagePath = `concerns/${uniqueFilename}`;
  
      console.log("Storage path:", storagePath);
  
      // Get the file data as a blob
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
  
      console.log("Successfully created blob of size:", blob.size);
  
      // Create storage reference
      const storageRef = storage().ref(storagePath);
  
      // Create upload task using put() instead of putFile()
      const uploadTask = storageRef.put(blob);
  
      // Set up upload monitoring
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress}%`);
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload error:", error);
            setIsUploading(false);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            console.log("Upload completed successfully");
            try {
              // Get the download URL
              const downloadUrl = await storageRef.getDownloadURL();
              console.log("Download URL obtained:", downloadUrl);
              setIsUploading(false);
              resolve(downloadUrl);
            } catch (urlError) {
              console.error("Error getting download URL:", urlError);
              setIsUploading(false);
              reject(urlError);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in uploadImage function:", error);
      setIsUploading(false);
      Alert.alert("Error", "Failed to upload image: " + error.message);
      return null;
    }
  };

 // Fixed: Submit handler with proper image upload
const handleSubmit = async () => {
    if (!title || !description || !location) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
  
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Authentication Required", "You must be logged in to submit a concern.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Upload image if selected
      let imageUrl = null;
      if (imageUri) {
        try {
          console.log("Starting image upload process...");
          imageUrl = await uploadImage(imageUri);
          console.log("Image upload completed, URL:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          // Ask if user wants to continue without image
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              "Upload Failed",
              "Would you like to submit your concern without the image?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Continue",
                  onPress: () => resolve(true),
                },
              ]
            );
          });
  
          if (!shouldContinue) {
            setIsLoading(false);
            return;
          }
        }
      }
  
      console.log("Proceeding to add concern to Firestore");
  
      // Add concern to Firestore
      await submitConcernToFirestore(imageUrl);
  
      console.log("Concern added successfully");
  
      // Reset form and show success message
      resetForm();
      Alert.alert("Success", "Your concern has been recorded.");
      setShowForm(false);
      fetchConcerns(); // Refresh the list
    } catch (error) {
      console.error("Error adding concern:", error);
      Alert.alert("Error", "There was an issue submitting your concern: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to submit concern data to Firestore
  const submitConcernToFirestore = async (imageUrl) => {
    const user = auth().currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }
  
    await firestore().collection('concerns').add({
      title,
      description,
      location,
      category,
      status: "Pending",
      userId: user.uid,
      userEmail: user.email,
      imageUrl,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  };
  
  // Helper function to reset the form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("General");
    setImageUri(null);
    setUploadProgress(0);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFC107';
      case 'in progress':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road':
        return 'road';
      case 'garbage':
        return 'delete';
      case 'water':
        return 'water';
      case 'electricity':
        return 'flash';
      default:
        return 'information';
    }
  };

  const categories = ["General", "Road", "Garbage", "Water", "Electricity"];

  const renderForm = () => (
    <View style={styles.formWrapper}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Submit New Concern</Text>
        <TouchableOpacity onPress={() => setShowForm(false)}>
          <Icon name="close" size={24} color="#555" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputWrapper}>
          <Icon name="format-title" size={22} color="#6200ee" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Concern Title"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="text" size={22} color="#6200ee" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your concern..."
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="map-marker" size={22} color="#6200ee" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Street Name, City)"
            placeholderTextColor="#888"
            value={location}
            onChangeText={setLocation}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="tag" size={22} color="#6200ee" style={styles.inputIcon} />
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setIsMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setIsMenuVisible(true)}
              >
                <Text style={styles.categoryText}>{category}</Text>
                <Icon name="chevron-down" size={20} color="#555" />
              </TouchableOpacity>
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setIsMenuVisible(false);
                }}
                title={cat}
                leadingIcon={getCategoryIcon(cat)}
              />
            ))}
          </Menu>
        </View>
        
        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Add Photo Evidence</Text>
          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Icon name="camera" size={22} color="#6200ee" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
              <Icon name="image" size={22} color="#6200ee" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          
          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Icon name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              <Text style={styles.progressText}>{Math.round(uploadProgress)}% Uploaded</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit} 
          disabled={isLoading || isUploading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Icon name="send" size={18} color="#ffffff" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Submit Concern</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Provider>
      <StatusBar backgroundColor="#5000ce" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Icon name="alert-circle-outline" size={24} color="#ffffff" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>My Concerns</Text>
            </View>
          </View>
        </View>

        {showForm ? (
          renderForm()
        ) : (
          <>
            {/* Empty state */}
            {concerns.length === 0 && !isFetching && (
              <View style={styles.emptyState}>
                <Icon name="clipboard-alert-outline" size={80} color="#d0d0d0" />
                <Text style={styles.emptyStateText}>No concerns yet</Text>
                <Text style={styles.emptyStateSubText}>
                  Submit a new concern by tapping the + button below
                </Text>
              </View>
            )}

            {/* List of Concerns */}
            <ScrollView
              style={styles.concernList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching}
                  onRefresh={fetchConcerns}
                  colors={["#6200ee"]}
                />
              }
            >
              {concerns.map((concern) => (
                <Card key={concern.id} style={styles.concernCard} elevation={3}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <Icon 
                          name={getCategoryIcon(concern.category)} 
                          size={20} 
                          color="#6200ee" 
                          style={styles.categoryIcon} 
                        />
                        <Text style={styles.concernTitle}>{concern.title}</Text>
                      </View>
                      <Chip 
                        style={[styles.statusChip, { backgroundColor: getStatusColor(concern.status) + '20' }]}
                        textStyle={{ color: getStatusColor(concern.status), fontWeight: '600' }}
                      >
                        {concern.status}
                      </Chip>
                    </View>
                    
                    <Text style={styles.concernDescription}>{concern.description}</Text>
                    
                    {/* Display image if available */}
                    {concern.imageUrl && (
                      <TouchableOpacity 
                        onPress={() => {
                          // You can add navigation to a full-screen image viewer here
                          navigation.navigate('ImageViewer', { imageUrl: concern.imageUrl });
                        }}
                      >
                        <Image 
                          source={{ uri: concern.imageUrl }} 
                          style={styles.concernImage} 
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.metadataContainer}>
                      <View style={styles.detailRow}>
                        <Icon name="map-marker" size={16} color="#6200ee" />
                        <Text style={styles.concernDetail}>{concern.location}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Icon name="clock-outline" size={16} color="#6200ee" />
                        <Text style={styles.concernDetail}>
                          {concern.createdAt?.toDate().toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
              
              {/* Add padding at the bottom for FAB */}
              <View style={{ height: 80 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <FAB
              style={styles.fab}
              icon="plus"
              color="#fff"
              onPress={() => setShowForm(true)}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 40, // Balance the back button
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '70%',
  },
  formWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    paddingBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  // New image upload related styles
  imageSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0e6fa',
    borderRadius: 12,
    padding: 12,
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#d9c5f2',
  },
  imageButtonText: {
    color: '#6200ee',
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  progressContainer: {
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    height: 16,
    position: 'relative',
    marginBottom: 12,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#6200ee',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    lineHeight: 16,
  },
  concernImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginTop: 10,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  concernList: {
    padding: 16,
  },
  concernCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  categoryIcon: {
    marginRight: 8,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusChip: {
    height: 28,
    borderRadius: 14,
  },
  concernDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  concernDetail: {
    fontSize: 12,
    color: '#777',
    marginLeft: 5,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#eee',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});