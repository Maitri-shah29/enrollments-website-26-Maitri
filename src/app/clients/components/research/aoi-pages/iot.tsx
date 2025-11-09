"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const iotPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          IoT
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            The IoT AOI connects the digital and physical worlds through smart
            devices and data-driven automation. From developing sensor-based
            systems to creating interconnected ecosystems, members design
            solutions that make everyday technology more intelligent and
            responsive.
            <br />
            Key Focus Areas <br />
            1. Sensor Technologies: Temperature, motion, proximity sensors; data
            acquisition and calibration
            <br />
            2. Embedded Systems: Microcontrollers (Arduino, Raspberry Pi, ESP32)
            and real-time programming
            <br />
            3. Communication Protocols: MQTT, CoAP, Zigbee, Bluetooth LE,
            LoRaWAN, and 5G
            <br />
            4. Edge Computing: Local data processing to reduce latency and
            bandwidth
            <br />
            5. IoT Cloud Platforms: AWS IoT, Google Cloud IoT, Azure IoT for
            data management
            <br />
            6. Smart Applications: Home automation, energy management, and
            intelligent infrastructure
            <br />
            7. Industrial IoT: Predictive maintenance, supply chain
            optimization, smart manufacturing
            <br />
            8. Security Concerns: Device authentication and protecting against
            IoT vulnerabilities
          </p>
        </div>
      </div>
    </div>
  );
};

export default iotPage;
