import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import IntroScreen from "./src/screens/IntroScreen";
import Login from "./src/Login";
import Detail from "./src/Detail";
import Dashboard from "./src/Dashboard";
import AdminDashboard from "./src/AdminDashboard";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import ProjectDetailsScreen from "./src/screens/ProjectDetailsScreen";
import AppointmentsScreen from "./src/screens/AppointmentsScreen";
import SetupPin from "./src/SetupPin";
import ConcernsScreen from "./src/screens/ConcernsScreen"; // Import ConcernsScreen
import ImageViewerScreen from "./src/screens/ImageViewerScreen"; // Import ImageViewerScreen

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Intro">
                <Stack.Screen
                    name="Intro"
                    component={IntroScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Login"
                    component={Login}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SetupPin"
                    component={SetupPin}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Detail"
                    component={Detail}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Dashboard"
                    component={Dashboard}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AdminDashboard"
                    component={AdminDashboard}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Projects"
                    component={ProjectsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ProjectDetails"
                    component={ProjectDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Appointments"
                    component={AppointmentsScreen}
                    options={{ headerShown: false }}
                />
                {/* Add ConcernsScreen to the navigation stack */}
                <Stack.Screen
                    name="Concerns"
                    component={ConcernsScreen}
                    options={{ headerShown: false }}
                />
                {/* Add ImageViewerScreen to the navigation stack */}
                <Stack.Screen
                    name="ImageViewer"
                    component={ImageViewerScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}