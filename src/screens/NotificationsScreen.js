import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sample notification data - replace with real data from Firestore
  const sampleNotifications = [
    {
      id: "1",
      title: "New Town Hall Schedule",
      message: "The town hall meeting has been rescheduled to March 25th at 2:00 PM.",
      date: new Date(2025, 2, 18, 14, 30),
      read: false,
      type: "event",
    },
    {
      id: "2",
      title: "Your concern has been addressed",
      message: "Your concern regarding road maintenance has been addressed by the office.",
      date: new Date(2025, 2, 17, 10, 15),
      read: true,
      type: "concern",
    },
    {
      id: "3",
      title: "New Infrastructure Project",
      message: "A new infrastructure project has been approved for Barangay Alabang.",
      date: new Date(2025, 2, 16, 9, 45),
      read: false,
      type: "project",
    },
    {
      id: "4",
      title: "Bill Update",
      message: "The education bill has been passed to the second reading.",
      date: new Date(2025, 2, 15, 16, 20),
      read: true,
      type: "law",
    },
    {
      id: "5",
      title: "Office Closure",
      message: "The district office will be closed on March 31st for a national holiday.",
      date: new Date(2025, 2, 14, 11, 0),
      read: true,
      type: "info",
    },
  ];

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      
      if (currentUser) {
        // In a real app, you would fetch from Firestore
        // const notificationsSnapshot = await firestore()
        //   .collection("notifications")
        //   .where("userId", "==", currentUser.uid)
        //   .orderBy("date", "desc")
        //   .get();
        
        // const notificationsData = notificationsSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data(),
        // }));
        
        // For demo purposes, we're using sample data
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotifications(sampleNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      // In a real app, you would update Firestore
      // await firestore()
      //   .collection("notifications")
      //   .doc(id)
      //   .update({ read: true });
      
      // For demo purposes, we're updating the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // In a real app, you would batch update Firestore
      // const batch = firestore().batch();
      // notifications.forEach(notification => {
      //   if (!notification.read) {
      //     const notificationRef = firestore().collection("notifications").doc(notification.id);
      //     batch.update(notificationRef, { read: true });
      //   }
      // });
      // await batch.commit();
      
      // For demo purposes, we're updating the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      Alert.alert("Success", "All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    try {
      // In a real app, you would delete from Firestore
      // await firestore()
      //   .collection("notifications")
      //   .doc(id)
      //   .delete();
      
      // For demo purposes, we're updating the local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      return () => {
        StatusBar.setBarStyle("default");
      };
    }, [])
  );

  const handleNotificationPress = useCallback((notification) => {
    markAsRead(notification.id);
    
    // Navigate to the appropriate screen based on notification type
    switch (notification.type) {
      case "concern":
        navigation.navigate("Concerns");
        break;
      case "project":
        navigation.navigate("Projects");
        break;
      case "law":
        navigation.navigate("Laws");
        break;
      case "event":
        navigation.navigate("Updates");
        break;
      case "info":
        navigation.navigate("Info");
        break;
      default:
        // Default just marks as read without navigation
        break;
    }
  }, [markAsRead, navigation]);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteNotification(id) }
      ]
    );
  }, [deleteNotification]);

  const renderNotificationItem = ({ item }) => {
    const formattedDate = item.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedTime = item.date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Determine icon based on notification type
    let icon;
    switch (item.type) {
      case "concern":
        icon = "comments";
        break;
      case "project":
        icon = "tasks";
        break;
      case "law":
        icon = "balance-scale";
        break;
      case "event":
        icon = "calendar-alt";
        break;
      case "info":
        icon = "info-circle";
        break;
      default:
        icon = "bell";
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationIconContainer, { backgroundColor: getTypeColor(item.type) }]}>
            <FontAwesome5 name={icon} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationDate}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <FontAwesome5 name="trash-alt" size={16} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Helper function to get color based on notification type
  const getTypeColor = (type) => {
    switch (type) {
      case "concern":
        return "#E74C3C";
      case "project":
        return "#3498DB";
      case "law":
        return "#9B59B6";
      case "event":
        return "#27AE60";
      case "info":
        return "#F39C12";
      default:
        return "#003580";
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="bell-slash" size={60} color="#CCC" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        When you receive notifications, they will appear here
      </Text>
    </View>
  );

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003580" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={markAllAsRead}
          disabled={unreadNotificationsCount === 0}
        >
          <Text 
            style={[
              styles.markAllText, 
              unreadNotificationsCount === 0 && styles.markAllTextDisabled
            ]}
          >
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003580" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#003580", "#FFD700"]}
              tintColor="#003580"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#003580",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markAllText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  markAllTextDisabled: {
    color: "rgba(255, 215, 0, 0.5)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationsList: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#003580",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#003580",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default NotificationsScreen;