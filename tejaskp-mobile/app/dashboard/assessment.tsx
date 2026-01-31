import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, UploadCloud, X, FileText, CheckCircle } from "lucide-react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// MOCK USER ID for prototype (Bhakti Gandhi)
const MOCK_USER_ID = "476c71f4-dda3-4a65-be9d-ea816eb8270f";
const API_URL = "https://tejaskp.in"; // Or local IP if dev

export default function AssessmentScreen() {
    const router = useRouter();
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                multiple: true,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets) {
                // Determine specific upload limit logic if needed, currently just adding
                setFiles(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            Alert.alert("Error", "Failed to pick document");
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            Alert.alert("Required", "Please select at least one PDF file.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('userId', MOCK_USER_ID);

            files.forEach((file) => {
                // @ts-ignore
                formData.append('files', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/pdf'
                });
            });

            const res = await fetch(`${API_URL}/api/student/documents/assessment`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await res.json();

            if (data.success) {
                Alert.alert("Success", "Assessment uploaded successfully!", [
                    { text: "OK", onPress: () => { setFiles([]); router.back(); } }
                ]);
            } else {
                Alert.alert("Upload Failed", data.error || "Unknown error");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error or server unreachable.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View className="flex-1 bg-obsidian">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="absolute inset-0 bg-[#050505]">
                <LinearGradient colors={['rgba(26,26,26,0.8)', '#000000']} className="absolute inset-0" />
            </View>

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="p-4 flex-row items-center border-b border-gold-500/10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-charcoal rounded-full">
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Assessment Upload</Text>
                </View>

                <ScrollView className="flex-1 p-6">
                    <View className="bg-charcoal border border-gold-500/20 rounded-2xl p-6 mb-6">
                        <Text className="text-gold-400 font-bold mb-2">Instructions</Text>
                        <Text className="text-gray-400 leading-5">
                            • Upload your final project report and code summary.{"\n"}
                            • Only PDF files are allowed.{"\n"}
                            • Ensure files are under 5MB each.
                        </Text>
                    </View>

                    {/* File Picker */}
                    <TouchableOpacity
                        onPress={pickDocument}
                        className="border-2 border-dashed border-gold-500/40 bg-gold-500/5 rounded-2xl p-8 items-center justify-center mb-6 active:bg-gold-500/10"
                    >
                        <UploadCloud size={40} color="#EAB308" />
                        <Text className="text-gold-500 font-bold mt-4">Select PDF Files</Text>
                        <Text className="text-gold-500/50 text-xs mt-1">Tap to browse</Text>
                    </TouchableOpacity>

                    {/* Selected Files List */}
                    {files.length > 0 && (
                        <View className="space-y-3 mb-8">
                            <Text className="text-white font-bold mb-2">Selected Files ({files.length})</Text>
                            {files.map((file, index) => (
                                <View key={index} className="flex-row items-center bg-charcoal p-3 rounded-lg border border-gray-800">
                                    <View className="w-10 h-10 bg-red-500/10 rounded items-center justify-center mr-3">
                                        <FileText size={20} color="#ef4444" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-medium text-sm truncate" numberOfLines={1}>{file.name}</Text>
                                        <Text className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeFile(index)} className="p-2">
                                        <X size={18} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleUpload}
                        disabled={isUploading || files.length === 0}
                        className={`py-4 rounded-xl items-center flex-row justify-center gap-2 ${isUploading || files.length === 0 ? 'bg-gray-800 opacity-50' : 'bg-gold-500 shadow-lg shadow-gold-500/20'}`}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <CheckCircle size={20} color="#000" />
                                <Text className="text-black font-bold text-lg">SUBMIT ASSESSMENT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
