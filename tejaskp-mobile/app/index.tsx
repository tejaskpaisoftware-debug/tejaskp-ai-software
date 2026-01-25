import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, User } from "lucide-react-native";

type Role = "STUDENT" | "EMPLOYEE" | "CLIENT";

export default function LoginScreen() {
    const [activeRole, setActiveRole] = useState<Role>("STUDENT");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = () => {
        // Mock login
        router.push("/dashboard");
    };

    return (
        <View className="flex-1 bg-obsidian">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Effect */}
            <View className="absolute inset-0 bg-[#050505]">
                <LinearGradient
                    colors={['rgba(26,26,26,0.8)', '#000000']}
                    className="absolute inset-0"
                />
            </View>

            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>

                    {/* Logo Section */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 rounded-full border-2 border-gold-500 items-center justify-center bg-black mb-4 shadow-lg shadow-gold-500/30">
                            <Text className="text-gold-500 font-bold text-2xl">TP</Text>
                        </View>
                        <Text className="text-3xl font-bold text-gold-500 tracking-wider text-center">TEJASKP AI</Text>
                        <Text className="text-gold-200/60 tracking-[0.2em] text-xs mt-1 text-center">FUTURE IS HERE</Text>
                    </View>

                    {/* Login Card */}
                    <View className="bg-charcoal/80 border border-gold-500/30 rounded-2xl overflow-hidden">
                        {/* Tabs */}
                        <View className="flex-row border-b border-gold-500/20">
                            {(["STUDENT", "EMPLOYEE", "CLIENT"] as Role[]).map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    onPress={() => setActiveRole(role)}
                                    className={`flex-1 py-4 items-center relative ${activeRole === role ? 'bg-gold-500' : 'bg-transparent'}`}
                                >
                                    <Text className={`text-xs font-bold tracking-wider ${activeRole === role ? 'text-obsidian' : 'text-gray-500'}`}>
                                        {role}
                                    </Text>
                                    {activeRole === role && (
                                        <View className="absolute bottom-0 h-1 bg-white w-full" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Form */}
                        <View className="p-6 space-y-6">
                            <View>
                                <Text className="text-2xl font-bold text-white text-center mb-1">
                                    {activeRole === 'STUDENT' ? 'Student Portal' : activeRole === 'EMPLOYEE' ? 'Staff Access' : 'Client Dashboard'}
                                </Text>
                                <Text className="text-gold-500/60 text-xs text-center">Please sign in with your mock credentials</Text>
                            </View>

                            <View className="space-y-4">
                                <View>
                                    <Text className="text-xs font-bold text-gold-500/80 uppercase tracking-wider mb-2">Mobile or Username</Text>
                                    <View className="flex-row items-center bg-charcoal border border-gold-500/40 rounded-lg px-4 py-3">
                                        <User size={18} color="#9ca3af" className="mr-3" />
                                        <TextInput
                                            value={mobile}
                                            onChangeText={setMobile}
                                            placeholder="Enter mobile or username"
                                            placeholderTextColor="#9ca3af"
                                            className="flex-1 text-white font-medium"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-xs font-bold text-gold-500/80 uppercase tracking-wider mb-2">Password</Text>
                                    <View className="flex-row items-center bg-charcoal border border-gold-500/40 rounded-lg px-4 py-3">
                                        <Lock size={18} color="#9ca3af" className="mr-3" />
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="pass123"
                                            placeholderTextColor="#9ca3af"
                                            secureTextEntry={!showPassword}
                                            className="flex-1 text-white font-medium"
                                        />
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center mt-2">
                                    <TouchableOpacity className="flex-row items-center">
                                        <View className="w-4 h-4 border border-gray-600 rounded mr-2" />
                                        <Text className="text-xs text-gray-400">Remember me</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity>
                                        <Text className="text-xs text-gold-400">Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    className="bg-gold-500 py-4 rounded-lg shadow-lg shadow-gold-500/20 active:opacity-90 mt-4"
                                >
                                    <Text className="text-obsidian font-bold text-center tracking-wide">ACCESS DASHBOARD</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="bg-obsidian/50 p-4 border-t border-gold-500/10">
                            <Text className="text-[10px] text-gray-500 text-center">Protected by TEJASKP Security Systems v1.0</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
