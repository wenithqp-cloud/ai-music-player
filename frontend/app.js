import React, { createContext, useState, useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, Button, StyleSheet } from "react-native";
import { Audio } from "expo-av";

const ThemeContext = createContext();

const themes = {
  dark: { background: "#121212", text: "#ffffff" },
  light: { background: "#ffffff", text: "#000000" },
  neon: { background: "#000000", text: "#39ff14" },
  ocean: { background: "#001f3f", text: "#7FDBFF" },
  sunset: { background: "#2b1d0e", text: "#ffb347" }
};

function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark");

  return (
    <ThemeContext.Provider value={{ theme: themes[mode], setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

function HomeScreen() {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 22 }}>
        🎵 AI Music Player
      </Text>
    </View>
  );
}

function PlayerScreen() {
  const { theme } = useContext(ThemeContext);
  const [sound, setSound] = useState(null);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("./assets/sample.mp3")
    );
    setSound(sound);
    await sound.playAsync();
  }

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Button title="Play Sample Song" onPress={playSound} />
      <Button title="Stop" onPress={stopSound} />
    </View>
  );
}

function SettingsScreen() {
  const { setMode } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button title="Dark Mode" onPress={() => setMode("dark")} />
      <Button title="Light Mode" onPress={() => setMode("light")} />
      <Button title="Neon Mode" onPress={() => setMode("neon")} />
      <Button title="Ocean Mode" onPress={() => setMode("ocean")} />
      <Button title="Sunset Mode" onPress={() => setMode("sunset")} />
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Player" component={PlayerScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
