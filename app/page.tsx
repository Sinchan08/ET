// app/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, User, Shield, Upload, Brain, FileText, BarChart3, Map, CheckCircle, AlertTriangle, Eye, Lock, TrendingUp, Users, Mail, Phone, MapPin } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Upload, title: "Upload Data", description: "Import electricity consumption data from CSV/Excel files with validation" },
    { icon: Brain, title: "AI Detection", description: "Advanced ML algorithms detect anomalies with 94%+ accuracy" },
    { icon: FileText, title: "File Complaints", description: "Users can report issues and track complaint resolution status" },
    { icon: BarChart3, title: "Analytics Dashboard", description: "Comprehensive insights with charts, trends, and KPI monitoring" },
    { icon: Map, title: "Geo Insights", description: "Geographic visualization of theft patterns across regions" },
    { icon: Shield, title: "Secure & Reliable", description: "Enterprise-grade security with explainable AI predictions" }
  ];

  const steps = [
    { step: "01", title: "Data Input", description: "Upload consumption data with RRNO, voltage, current readings", icon: Upload },
    { step: "02", title: "ML Prediction", description: "XGBoost model analyzes patterns and flags anomalies", icon: Brain },
    { step: "03", title: "Flag Theft", description: "System identifies suspicious consumption patterns", icon: AlertTriangle },
    { step: "04", title: "Investigate", description: "Review detailed reports with SHAP explanations", icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Zap className="h-20 w-20 text-blue-600 animate-pulse" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Electricity Theft Detection System
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-powered solution to detect electricity theft, reduce revenue losses, and ensure fair billing for consumers across India.
            </p>

            {/* --- THIS IS THE MAIN CHANGE --- */}
            <Button asChild size="lg">
                <Link href="/auth">Get Started</Link>
            </Button>
            {/* --- END OF MAIN CHANGE --- */}

          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About the System</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Electricity theft costs Indian DISCOMs over ₹20,000 crores annually. Our AI-powered system uses machine learning to analyze consumption patterns, voltage fluctuations, and billing data to detect anomalies with 94% accuracy. This helps reduce revenue losses while ensuring fair billing for honest consumers.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Features Overview</h2>
            <p className="text-lg text-muted-foreground">Comprehensive tools for electricity theft detection and management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple 4-step process from data input to theft detection</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <step.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Electricity Theft Detection System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}