import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const AppointmentForm = ({ visible, onClose, onSubmit, initialData }) => {
  const [type, setType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("09:00 AM");
  const [isVirtual, setIsVirtual] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(new Date());
  const [isReschedule, setIsReschedule] = useState(false);

  // Add "Other" to the appointment types
const appointmentTypes = [
    { id: 1, name: "Constituent Assistance", icon: "hands-helping", description: "General consultation and assistance" },
    { id: 2, name: "Document Processing", icon: "file-alt", description: "Processing of official documents and permits" },
    { id: 3, name: "Community Concerns", icon: "users", description: "Discussion of issues affecting your community" },
    { id: 4, name: "Project Proposal", icon: "project-diagram", description: "Present community project ideas" },
    { id: 5, name: "Other", icon: "ellipsis-h", description: "Other appointment purpose" },
];
  // Initialize form with initialData if provided (for reschedule)
  useEffect(() => {
    if (initialData) {
      setIsReschedule(true);
      setType(initialData.type);
      setPurpose(initialData.purpose);
      
      // Parse date from initialData
      if (initialData.date) {
        setDate(new Date(initialData.date));
      }
      
      // Set time
      if (initialData.time) {
        setTime(initialData.time);
        
        // Convert time string to Date object for the time picker
        const [hours, minutesPart] = initialData.time.split(":");
        let [minutes, period] = minutesPart.split(" ");
        let hour = parseInt(hours);
        
        if (period === "PM" && hour < 12) {
          hour += 12;
        } else if (period === "AM" && hour === 12) {
          hour = 0;
        }
        
        const timeDate = new Date();
        timeDate.setHours(hour);
        timeDate.setMinutes(parseInt(minutes));
        timeDate.setSeconds(0);
        setTimePickerValue(timeDate);
      }
      
      setIsVirtual(initialData.isVirtual || false);
    } else {
      // Initialize with default values for new appointment
      resetForm();
    }
  }, [initialData]);

  // Reset form to default values
  const resetForm = () => {
    setType("");
    setPurpose("");
    
    // Set date to tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDate(tomorrow);
    
    setTime("09:00 AM");
    setTimePickerValue(tomorrow);
    setIsVirtual(false);
    setIsReschedule(false);
  };

  // Handle date change from DateTimePicker
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Handle time change from DateTimePicker
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTimePickerValue(selectedTime);
      
      // Format time string (e.g., "09:00 AM")
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      
      setTime(`${hour12}:${minutesStr} ${ampm}`);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!type) {
      Alert.alert("Error", "Please select an appointment type");
      return false;
    }
    if (!purpose.trim()) {
      Alert.alert("Error", "Please enter the purpose of your appointment");
      return false;
    }
    
    // Ensure date is not in the past
    const now = new Date();
    if (date < now && date.getDate() !== now.getDate()) {
      Alert.alert("Error", "Please select a future date for your appointment");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const appointmentData = {
      type,
      purpose,
      date: date.toISOString(),
      time,
      isVirtual,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    
    onSubmit(appointmentData);
  };

  // Render type selection buttons
const renderTypeSelections = () => {
    return appointmentTypes.map((appointmentType) => (
      <TouchableOpacity
        key={appointmentType.id}
        style={[
          styles.typeButton,
          type === appointmentType.name && styles.selectedTypeButton,
        ]}
        onPress={() => {
          setType(appointmentType.name);
          if (appointmentType.name === "Other" && purpose === "") {
            // If selecting "Other" and no purpose entered yet, set a prompt
            setPurpose("Please specify the purpose of your appointment...");
          }
        }}
      >
        <FontAwesome5 
          name={appointmentType.icon} 
          size={16} 
          color={type === appointmentType.name ? "#FFFFFF" : "#003580"} 
          style={styles.typeIcon} 
        />
        <Text
          style={[
            styles.typeButtonText,
            type === appointmentType.name && styles.selectedTypeButtonText,
          ]}
        >
          {appointmentType.name}
        </Text>
      </TouchableOpacity>
    ));
  };
  

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isReschedule ? "Reschedule Appointment" : "Schedule New Appointment"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesome5 name="times" size={20} color="#003580" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Appointment Type</Text>
                <View style={styles.typeButtonsContainer}>
                  {renderTypeSelections()}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Purpose</Text>
                <TextInput
                  style={styles.purposeInput}
                  placeholder="Enter the purpose of your appointment"
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Date & Time</Text>
                
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="calendar-alt" size={16} color="#003580" style={styles.inputIcon} />
                  <Text style={styles.datePickerButtonText}>
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePickerButton, { marginTop: 10 }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <FontAwesome5 name="clock" size={16} color="#003580" style={styles.inputIcon} />
                  <Text style={styles.datePickerButtonText}>{time}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={timePickerValue}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
              </View>

              <View style={styles.formSection}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Virtual Appointment</Text>
                  <Switch
                    value={isVirtual}
                    onValueChange={setIsVirtual}
                    trackColor={{ false: "#D1D1D1", true: "#003580" }}
                    thumbColor={isVirtual ? "#FFD700" : "#F4F3F4"}
                  />
                </View>
                {isVirtual && (
                  <Text style={styles.virtualNote}>
                    You will receive a link to join the virtual appointment in your confirmation email.
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {isReschedule ? "Reschedule Appointment" : "Schedule Appointment"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  formScrollView: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  typeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    width: "48%",
    backgroundColor: "#F5F7FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedTypeButton: {
    backgroundColor: "#003580",
    borderColor: "#003580",
  },
  typeButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  selectedTypeButtonText: {
    color: "#FFFFFF",
  },
  purposeInput: {
    backgroundColor: "#F5F7FA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlignVertical: "top",
    minHeight: 80,
  },
  datePickerButton: {
    backgroundColor: "#F5F7FA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 10,
  },
  datePickerButtonText: {
    color: "#333",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  virtualNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#003580",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  typeIcon: {
    marginBottom: 5,
  },
});

export default AppointmentForm;