import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc } from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

// Import the appointment form component
import AppointmentForm from "../components/AppointmentForm";

export default function AppointmentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Fetch appointments from Firestore
  const fetchAppointments = useCallback(async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
  
    try {
      setLoading(true);
      const db = getFirestore(); // You need to import getFirestore

      const appointmentsRef = collection(db, "appointments");
      const appointmentsQuery = query(
        appointmentsRef,
        where("userId", "==", currentUser.uid),
        orderBy("date", "desc")
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
  
      const appointmentsData = [];
      appointmentsSnapshot.forEach(doc => {
        appointmentsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort appointments by date (upcoming first, then past)
      const now = new Date().toISOString();
      const sortedAppointments = appointmentsData.sort((a, b) => {
        // Sort upcoming appointments by date (ascending)
        if (a.date >= now && b.date >= now) {
          return new Date(a.date) - new Date(b.date);
        }
        // Sort past appointments by date (descending)
        if (a.date < now && b.date < now) {
          return new Date(b.date) - new Date(a.date);
        }
        // Upcoming appointments first
        return a.date >= now ? -1 : 1;
      });

      setAppointments(sortedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      Alert.alert("Error", "Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch appointments when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle appointment submission
  const handleSubmitAppointment = async (appointmentData) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
  
    try {
      setLoading(true);
      const db = getFirestore(); // You need to import getFirestore

      const appointmentsRef = collection(db, "appointments");
      await addDoc(appointmentsRef, {
        ...appointmentData,
        userId: currentUser.uid,
      });

      setAppointmentModalVisible(false);
      Alert.alert(
        "Appointment Scheduled",
        "Your appointment has been scheduled. You will receive a confirmation shortly."
      );
      fetchAppointments();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      Alert.alert("Error", "Failed to schedule appointment. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = (appointment) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const db = getFirestore(); // You need to import getFirestore

              const appointmentRef = doc(db, "appointments", appointment.id);
              await updateDoc(appointmentRef, {
                status: "Cancelled",
                cancelledAt: new Date().toISOString(),
              });
              Alert.alert("Success", "Your appointment has been cancelled.");
              fetchAppointments();
            } catch (error) {
              console.error("Error cancelling appointment:", error);
              Alert.alert("Error", "Failed to cancel appointment. Please try again.");
            } finally {
              setLoading(false);
              setDetailsModalVisible(false);
            }
          },
        },
      ]
    );
  };

  // Handle reschedule appointment
  const handleRescheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModalVisible(false);
    setAppointmentModalVisible(true);
  };

  // View appointment details
  const viewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModalVisible(true);
  };

  // Render appointment status badge
  const renderStatusBadge = (status) => {
    let badgeStyle = styles.statusBadge;
    let textStyle = styles.statusText;

    switch (status) {
      case "Confirmed":
        badgeStyle = { ...badgeStyle, backgroundColor: "#4CAF50" };
        break;
      case "Pending":
        badgeStyle = { ...badgeStyle, backgroundColor: "#FF9800" };
        break;
      case "Cancelled":
        badgeStyle = { ...badgeStyle, backgroundColor: "#F44336" };
        break;
      case "Completed":
        badgeStyle = { ...badgeStyle, backgroundColor: "#2196F3" };
        break;
      default:
        badgeStyle = { ...badgeStyle, backgroundColor: "#9E9E9E" };
    }

    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{status}</Text>
      </View>
    );
  };

  // Render appointment card
  const renderAppointmentCard = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const isUpcoming = appointmentDate >= new Date();
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => viewAppointmentDetails(appointment)}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>{appointmentDate.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {appointmentDate.toLocaleString("default", { month: "short" })}
            </Text>
          </View>

          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentType}>{appointment.type}</Text>
            <View style={styles.appointmentTimeRow}>
              <FontAwesome5 name="clock" size={12} color="#003580" style={styles.timeIcon} />
              <Text style={styles.appointmentTime}>{appointment.time}</Text>
              {appointment.isVirtual && (
                <View style={styles.virtualBadge}>
                  <FontAwesome5 name="video" size={10} color="#FFFFFF" />
                  <Text style={styles.virtualText}>Virtual</Text>
                </View>
              )}
            </View>
          </View>

          {renderStatusBadge(appointment.status)}
        </View>

        <View style={styles.appointmentBody}>
          <Text style={styles.purposeLabel}>Purpose:</Text>
          <Text style={styles.purposeText} numberOfLines={2}>
            {appointment.purpose}
          </Text>
        </View>

        <View style={styles.appointmentFooter}>
          <FontAwesome5 name="info-circle" size={14} color="#003580" />
          <Text style={styles.viewDetailsText}>View Details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render appointment details modal
  const renderAppointmentDetailsModal = () => {
    if (!selectedAppointment) return null;

    const appointmentDate = new Date(selectedAppointment.date);
    const isUpcoming = appointmentDate >= new Date() && selectedAppointment.status !== "Cancelled";
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color="#003580" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsModalBody}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Appointment Type:</Text>
                <Text style={styles.detailsValue}>{selectedAppointment.type}</Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Date & Time:</Text>
                <Text style={styles.detailsValue}>
                  {formattedDate} at {selectedAppointment.time}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  {renderStatusBadge(selectedAppointment.status)}
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Appointment Mode:</Text>
                <Text style={styles.detailsValue}>
                  {selectedAppointment.isVirtual ? "Virtual Meeting" : "In-Person"}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Purpose:</Text>
                <Text style={styles.detailsValue}>{selectedAppointment.purpose}</Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>Scheduled On:</Text>
                <Text style={styles.detailsValue}>
                  {new Date(selectedAppointment.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {selectedAppointment.status === "Cancelled" && selectedAppointment.cancelledAt && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Cancelled On:</Text>
                  <Text style={styles.detailsValue}>
                    {new Date(selectedAppointment.cancelledAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}

              {isUpcoming && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    onPress={() => handleRescheduleAppointment(selectedAppointment)}
                  >
                    <FontAwesome5 name="calendar-alt" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelAppointment(selectedAppointment)}
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Appointments</Text>
      <TouchableOpacity
        style={styles.newAppointmentButton}
        onPress={() => setAppointmentModalVisible(true)}
      >
        <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
        <Text style={styles.newAppointmentText}>New</Text>
      </TouchableOpacity>
    </View>
  );

  // Render section header
  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <FontAwesome5 name="calendar-check" size={60} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No Appointments</Text>
      <Text style={styles.emptyStateText}>
        You don't have any appointments scheduled. Tap the 'New' button to schedule your first appointment.
      </Text>
    </View>
  );

  // Separate appointments into upcoming and past
  const upcomingAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) >= new Date() && appointment.status !== "Cancelled"
  );

  const pastAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) < new Date() || appointment.status === "Cancelled"
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003580" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#003580", "#FFD700"]}
            tintColor="#003580"
          />
        }
      >
        {appointments.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {upcomingAppointments.length > 0 && (
              <>
                {renderSectionHeader("Upcoming Appointments")}
                {upcomingAppointments.map(renderAppointmentCard)}
              </>
            )}

            {pastAppointments.length > 0 && (
              <>
                {renderSectionHeader("Past Appointments")}
                {pastAppointments.map(renderAppointmentCard)}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Appointment Form Modal */}
      {appointmentModalVisible && (
        <AppointmentForm
          visible={appointmentModalVisible}
          onClose={() => setAppointmentModalVisible(false)}
          onSubmit={handleSubmitAppointment}
          initialData={selectedAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {renderAppointmentDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#003580",
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  newAppointmentButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  newAppointmentText: {
    color: "#003580",
    fontWeight: "bold",
    marginLeft: 5,
  },
  scrollContainer: {
    padding: 15,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#003580",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  dateMonth: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "600",
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  appointmentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  timeIcon: {
    marginRight: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: "#666",
  },
  virtualBadge: {
    backgroundColor: "#03A9F4",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  virtualText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  appointmentBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  purposeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 14,
    color: "#333",
  },
  appointmentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#003580",
    fontWeight: "600",
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  detailsModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  detailsModalBody: {
    padding: 20,
  },
  detailsSection: {
    marginBottom: 15,
  },
  detailsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  detailsValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  rescheduleButton: {
    backgroundColor: "#003580",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
});