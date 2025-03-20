import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function UpdateScreen() {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                setLoading(true);
                
                // Get a reference to the updates collection
                const updatesCollection = firestore().collection('updates');
                
                // Create a query to get documents ordered by timestamp if available
                const updatesQuery = updatesCollection.orderBy('timestamp', 'desc');
                
                // Execute the query
                const querySnapshot = await updatesQuery.get();
                
                // Format the data from the documents
                const updatesData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || "No title",
                        description: data.description || "No description",
                        // Check if timestamp exists and format it
                        date: data.timestamp 
                            ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })
                            : (data.date || "No date") // Fallback to date field or default text
                    };
                });
                
                setUpdates(updatesData);
            } catch (err) {
                console.error("Error fetching updates:", err);
                setError("Failed to load updates. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    // Function to refresh updates
    const refreshUpdates = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const updatesCollection = firestore().collection('updates');
            const updatesQuery = updatesCollection.orderBy('timestamp', 'desc');
            const querySnapshot = await updatesQuery.get();
            
            const updatesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || "No title",
                    description: data.description || "No description",
                    date: data.timestamp 
                        ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                        : (data.date || "No date")
                };
            });
            
            setUpdates(updatesData);
        } catch (err) {
            console.error("Error refreshing updates:", err);
            setError("Failed to refresh updates. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Icon name="update" size={30} color="#ffffff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Latest Updates</Text>
            </View>

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0275d8" />
                    <Text style={styles.loadingText}>Loading updates...</Text>
                </View>
            )}

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={24} color="#d9534f" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Updates List */}
            {!loading && !error && (
                <ScrollView 
                    style={styles.updateList} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={updates.length === 0 ? styles.emptyContentContainer : null}
                >
                    {updates.length > 0 ? (
                        updates.map((update) => (
                            <Card key={update.id} style={styles.updateCard}>
                                <Card.Content>
                                    <Text style={styles.updateTitle}>{update.title}</Text>
                                    <Text style={styles.updateDescription}>{update.description}</Text>
                                    <Text style={styles.updateDate}>{update.date}</Text>
                                </Card.Content>
                            </Card>
                        ))
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Icon name="information-outline" size={50} color="#aaa" />
                            <Text style={styles.emptyStateText}>No updates available</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Add documents to your Firestore "updates" collection to see them here
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        backgroundColor: "#0275d8",
        paddingVertical: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
    },
    headerIcon: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#ffffff",
    },
    updateList: {
        padding: 15,
    },
    updateCard: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 10,
    },
    updateTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0275d8",
    },
    updateDescription: {
        fontSize: 14,
        color: "#555",
        marginTop: 5,
    },
    updateDate: {
        fontSize: 12,
        color: "#888",
        marginTop: 5,
        fontStyle: "italic",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: "#555",
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "#ffeeee",
        margin: 15,
        borderRadius: 8,
    },
    errorText: {
        color: "#d9534f",
        marginTop: 5,
        textAlign: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
    },
    emptyStateText: {
        marginTop: 10,
        color: "#888",
        fontSize: 16,
        fontWeight: "bold",
    },
    emptyStateSubtext: {
        marginTop: 5,
        color: "#888",
        fontSize: 14,
        textAlign: "center",
    },
    emptyContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});